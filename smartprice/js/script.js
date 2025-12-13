// This script handles all functionality for the main search page (index.html).

// --- START: PAGE INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // This listener runs once when the page is first loaded or refreshed.

    // --- Setup event listeners for all interactive elements on the page ---
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const sortSelect = document.getElementById("sortSelect");
    const storeBtns = document.querySelectorAll(".store-btn");
    
    if(searchBtn) searchBtn.addEventListener("click", () => performSearch(1));
    if(searchInput) searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") performSearch(1);
    });
    if(sortSelect) sortSelect.addEventListener("change", () => filterAndSortResults());
    if(storeBtns) storeBtns.forEach((btn) =>
        btn.addEventListener("click", function () {
            storeBtns.forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
            selectedStore = this.dataset.store;
            filterAndSortResults();
        })
    );
    
    // --- Suggestion rotation logic ---
    const suggestionText = document.getElementById("suggestionText");
    if (suggestionText) {
        const suggestions = [ 'Try: "wireless headphones", "smartphone", or "laptop"', 'Try: "running shoes", "smartwatch", or "backpack"', 'Try: "bluetooth speaker", "gaming mouse", or "monitor"'];
        let currentSuggestion = 0;
        const rotateSuggestions = () => {
            suggestionText.textContent = suggestions[currentSuggestion];
            currentSuggestion = (currentSuggestion + 1) % suggestions.length;
        };
        rotateSuggestions();
        setInterval(rotateSuggestions, 5000);
    }

    // --- STATE PERSISTENCE LOGIC USING URL PARAMETERS ---
    const urlParams = new URLSearchParams(window.location.search);
    const queryFromUrl = urlParams.get('query');
    const userInfo = JSON.parse(localStorage.getItem('pricePulseUser'));

    // Always fetch history if the user is logged in.
    if (userInfo && userInfo.token) {
        fetchAndDisplayHistory();
    }

    // Decide what to display based on the URL.
    if (queryFromUrl) {
        // If a query exists in the URL, restore it and run the search.
        console.log("Found query in URL:", queryFromUrl, ". Restoring state.");
        searchInput.value = queryFromUrl;
        performSearch(1, false); // Pass 'false' to prevent re-saving history.
    } else {
        // If there's no query in the URL, show the welcome message.
        showWelcomeMessage();
    }
});
// --- END: PAGE INITIALIZATION ---


// --- SEARCH HISTORY FUNCTIONS ---
async function saveSearchHistory(query) {
    const userInfo = JSON.parse(localStorage.getItem('pricePulseUser'));
    if (!userInfo || !userInfo.token) return;
    try {
        await fetch('http://localhost:5000/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
            body: JSON.stringify({ query })
        });
        await fetchAndDisplayHistory();
    } catch (error) {
        console.error('Failed to save search history:', error);
    }
}

async function fetchAndDisplayHistory() {
    const userInfo = JSON.parse(localStorage.getItem('pricePulseUser'));
    if (!userInfo || !userInfo.token) return;
    try {
        const res = await fetch('http://localhost:5000/api/history', {
            headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        if (!res.ok) return;
        const history = await res.json();
        const historyList = document.getElementById('historyList');
        const historySection = document.getElementById('historySection');
        if (history && history.length > 0) {
            historySection.style.display = 'block';
            historyList.innerHTML = '';
            const uniqueQueries = [...new Set(history.map(item => item.query.toLowerCase()))];
            uniqueQueries.forEach(query => {
                const li = document.createElement('li');
                li.textContent = query;
                li.addEventListener('click', () => {
                    document.getElementById('searchInput').value = query;
                    performSearch(1);
                });
                historyList.appendChild(li);
            });
        } else {
            historySection.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to fetch search history:', error);
    }
}


// --- MAIN PAGE LOGIC ---
let currentPage = 1;
let isLoading = false;
let selectedStore = "all";

async function performSearch(page = 1, saveHistory = true) {
    const searchInput = document.getElementById("searchInput");
    const resultsContainer = document.getElementById("resultsContainer");
    const loadingIndicator = document.getElementById("loading");
    const query = searchInput.value.trim();

    if (!query) {
        showWelcomeMessage();
        // Clear the URL query parameter if the search is empty
        history.pushState(null, '', window.location.pathname);
        return;
    }

    // Update the URL in the browser's address bar without reloading
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('query', query);
    history.pushState({ path: newUrl.href }, '', newUrl.href);

    if (saveHistory) {
        await saveSearchHistory(query);
    }

    isLoading = true;
    currentPage = page;
    if (page === 1) resultsContainer.innerHTML = "";
    loadingIndicator.style.display = "flex";

    try {
        const res = await fetch(`http://localhost:5000/api/products/compare?product=${encodeURIComponent(query)}&page=${page}`);
        const data = await res.json();
        const { amazon, walmart, ebay } = data;
        let product = [
            ...(Array.isArray(amazon?.products) ? amazon.products : []),
            ...(Array.isArray(walmart?.products) ? walmart.products : []),
            ...(Array.isArray(ebay?.products) ? ebay.products : []),
        ];
        let formattedResponse = filterAmazonResponse(product);
        formattedResponse = formattedResponse.filter(p => p.price > 0);
        displayResults(formattedResponse);
    } catch (error) {
        console.error("Search error:", error);
        showError();
    } finally {
        loadingIndicator.style.display = "none";
        isLoading = false;
    }
}


// --- HELPER FUNCTIONS ---

function convertToINR(priceString, usdToInrRate = 83) {
    if (typeof priceString === 'number') return `₹${priceString.toFixed(2)}`;
    const priceStr = String(priceString || '');
    if (priceStr.startsWith("$")) {
      const amountInUSD = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
      const amountInINR = amountInUSD * usdToInrRate;
      return `₹${amountInINR.toFixed(2)}`;
    }
    return priceStr;
}

function filterAmazonResponse(data) {
    return (data || []).map((p) => {
      let price = 0; 
      let originalPrice = 0;
      if (typeof p?.price === 'number') { 
          price = p.price; 
      } else { 
          const formattedPrice = p?.price ? convertToINR(p?.price) : 0; 
          price = formattedPrice ? Math.floor(parseFloat(formattedPrice.replace(/[^0-9.]/g, ""))) : 0; 
      }
      if (typeof p?.originalPrice === 'number') { 
          originalPrice = p.originalPrice; 
      } else { 
          const formattedOriginalPrice = p?.originalPrice ? convertToINR(p?.originalPrice) : 0; 
          originalPrice = formattedOriginalPrice ? Math.floor(parseFloat(formattedOriginalPrice.replace(/[^0-9.]/g, ""))) : 0; 
      }
      return { 
          id: p?.id, 
          name: p?.name, 
          price: parseFloat(price), 
          originalPrice: parseFloat(originalPrice || "0"), 
          rating: parseFloat(p?.rating) || 0, 
          no_of_rating: p?.no_of_rating, 
          image: p?.image, 
          url: p?.url, 
          delivery: p?.delivery || "N/A", 
          source: p?.source, 
          reviews: p?.reviews ?? Math.floor(Math.random() * 5000), 
          inStock: p?.inStock ?? Math.random() > 0.2, 
      };
    });
}

function displayResults(products) {
    if (!products?.length) return showNoResults();
    filterAndSortResults(products);
}

function filterAndSortResults(products) {
    const resultsContainer = document.getElementById("resultsContainer");
    const sortSelect = document.getElementById("sortSelect");

    if (!products) {
      const cards = Array.from(document.querySelectorAll(".product-card")).map((el) => ({ 
          element: el, 
          price: parseFloat(el.dataset.price), 
          rating: parseFloat(el.dataset.rating), 
          discount: parseFloat(el.dataset.discount), 
          source: el.dataset.source, 
      }));
      const visible = cards.filter((p) => selectedStore === "all" || p.source === selectedStore);
      visible.sort(sortLogic(sortSelect.value));
      visible.forEach((p) => resultsContainer.appendChild(p.element));
      cards.forEach((p) => { 
          p.element.style.display = selectedStore === "all" || p.source === selectedStore ? "block" : "none"; 
      });
      return;
    }

    resultsContainer.innerHTML = "";
    const cheapest = Math.min(...products.map((p) => p.price).filter(p => p > 0));
    const sortValue = sortSelect.value;
    if (selectedStore !== "all") { 
        products = products.filter((p) => p.source.toLowerCase() === selectedStore); 
    }
    products.sort(sortLogic(sortValue));
    products.forEach((product) => {
      const discount = product.price && product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
      const isCheapest = product.price === cheapest;
      const reviewLabel = product.source.toLowerCase() === 'walmart' ? 'ratings' : 'reviews';
      let ratingReviewsHTML = ''; 
      const hasRating = product.rating > 0; 
      const hasReviews = product.reviews && product.reviews !== 0 && String(product.reviews).length > 0;
      
      const formatReviews = (reviews) => { 
          if (typeof reviews === 'number') return reviews.toLocaleString("en-IN"); 
          return reviews; 
      }

      if (product.source.toLowerCase() === 'walmart' && !hasRating) { 
          ratingReviewsHTML = `<div class="rating"><i class="fas fa-star" style="color: var(--gray);"></i> <span style="margin-left: 4px; color: var(--gray);">No ratings yet</span></div>`; 
      } else if (hasRating) { 
          let reviewText = ''; 
          if (hasReviews && product.source.toLowerCase() !== 'ebay') { 
              reviewText = `<span style="margin-left: 8px; color: var(--gray);">(${formatReviews(product.reviews)} ${reviewLabel})</span>`; 
          } else if (hasReviews && product.source.toLowerCase() === 'ebay') { 
              reviewText = `<span style="margin-left: 8px; color: var(--gray);">(Seller Metrics: ${formatReviews(product.reviews)})</span>`; 
          } 
          ratingReviewsHTML = `<div class="rating"><i class="fas fa-star" style="color: #ffc107;"></i> ${product.rating} ${reviewText}</div>`; 
      } else if (product.source.toLowerCase() === 'ebay' && hasReviews) { 
          ratingReviewsHTML = `<div class="rating"><i class="fas fa-star" style="color: var(--gray);"></i> ${product.rating}<span style="margin-left: 8px; color: var(--gray);">(Seller Metrics: ${formatReviews(product.reviews)})</span></div>`; 
      } else { 
          ratingReviewsHTML = `<div class="rating"><i class="fas fa-star" style="color: var(--gray);"></i> ${product.rating}</div>`; 
      }

      const card = document.createElement("div"); 
      card.className = "product-card"; 
      Object.assign(card.dataset, { 
          id: product.id, 
          price: product.price, 
          rating: product.rating, 
          discount: discount ?? 0, 
          source: product.source.toLowerCase(), 
      });
      card.innerHTML = `
        <div class="product-image-container"> 
            ${isCheapest ? '<div class="cheapest-badge">Best Price</div>' : ""} 
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300?text=Product+Image'"> 
            <div class="product-badge">${discount > 0 ? `${discount}% OFF` : 'Sale'}</div> 
        </div>
        <div class="product-info"> 
            <h3 class="product-title">${product.name}</h3> 
            <div class="price-container"> 
                <span class="current-price">₹${product.price.toLocaleString("en-IN")}</span> 
                ${product.originalPrice > product.price ? `<span class="original-price">₹${product.originalPrice.toLocaleString("en-IN")}</span>` : ''} 
            </div> 
            ${ratingReviewsHTML} 
            <span class="store-tag ${product.source.toLowerCase()}"> 
                <i class="${product.source === "eBay" ? "fab fa-ebay" : product.source === "Amazon" ? "fab fa-amazon" : "fas fa-store"}"></i> ${product.source} 
            </span> 
            <div class="product-meta"> 
                <span><i class="fas fa-${product.inStock ? "check" : "times"}"></i> ${product.inStock ? "In Stock" : "Out of Stock"}</span> 
                <span><i class="fas fa-truck"></i> ${product.delivery}</span> 
            </div> 
            <a href="${product.url}" class="view-btn" target="_blank"> 
                <i class="fas fa-external-link-alt"></i> View on ${product.source} 
            </a> 
        </div>`;
      resultsContainer.appendChild(card);
    });
}

function sortLogic(type) { 
    return (a, b) => { 
        switch (type) { 
            case "price_asc": return a.price - b.price; 
            case "price_desc": return b.price - a.price; 
            case "rating": return b.rating - a.rating; 
            case "discount": return b.discount - a.discount; 
            default: return 0; 
        } 
    }; 
}

const showWelcomeMessage = () => { 
    const resultsContainer = document.getElementById("resultsContainer"); 
    if (resultsContainer) resultsContainer.innerHTML = ` 
        <div class="empty-state"> 
            <img src="https://cdn-icons-png.flaticon.com/512/3577/3577428.png" alt="Search"> 
            <h3>Find the best prices online</h3> 
            <p>Search for products to compare prices across top stores</p> 
        </div>`; 
}

const showNoResults = () => { 
    const resultsContainer = document.getElementById("resultsContainer"); 
    if(resultsContainer) resultsContainer.innerHTML = ` 
        <div class="empty-state"> 
            <img src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" alt="No results"> 
            <h3>No products found</h3> 
            <p>Try a different search term or check your spelling</p> 
        </div>`; 
}

const showError = () => { 
    const resultsContainer = document.getElementById("resultsContainer"); 
    if (resultsContainer) resultsContainer.innerHTML = ` 
        <div class="empty-state"> 
            <img src="https://cdn-icons-png.flaticon.com/512/4639/4639165.png" alt="Error"> 
            <h3>Something went wrong</h3> 
            <p>We couldn't complete your search. Please try again later.</p> 
        </div>`; 
}