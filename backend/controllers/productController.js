const axios = require("axios");
const {
  SCRAPER_API,
} = require("../config/apiConfig");

// CONSTANT for Currency Conversion
const USD_TO_INR_RATE = 87.81; 

// Helper function to perform currency conversion
const convertUsdToInr = (priceInUsd) => {
    const numericPrice = parseFloat(priceInUsd) || 0;
    return Math.floor(numericPrice * USD_TO_INR_RATE);
}

// Fetch from all platforms
exports.comparePrices = async (req, res) => {
  console.log(`Received request for product: ${req.query.product}`);
  const { product, page = 1 } = req.query;

  try {
    const [amazon, walmart, flipkart, ebay] = await Promise.all([
      fetchAmazon({ product, page }),
      fetchWalMartData({ product, page }),
      null, // Keeping flipkart disabled
      fetchEbay({ product, page }),
    ]);

    res.json({ amazon, walmart, flipkart: null, ebay });
  } catch (error) {
    console.error("Error fetching data:", error?.message);
    res.status(500).json({ error: error?.message });
  }
};

// =========================================================================
// API Fetch Functions (Using the CORRECT ScraperAPI Structured Endpoints)
// =========================================================================

const fetchAmazon = async (queryParams) => {
  try {
    const { product, page = 1 } = queryParams;
    
    const response = await axios.get(`https://${SCRAPER_API.host}/structured/amazon/search/v1`, {
      params: { 
        api_key: SCRAPER_API.key, 
        query: product,
        page: page,
        country_code: "in", 
        tld: "in", 
      },
    });
    
    return formattedResponse(response.data, "Amazon");
    
  } catch (error) {
    console.log("catch fetchAmazon error:", error?.message);
    return null;
  }
};

const fetchWalMartData = async (queryParams) => {
  try {
    const { product, page = 1 } = queryParams;
    
    const response = await axios.get(`https://${SCRAPER_API.host}/structured/walmart/search/v1`, {
      params: { 
        api_key: SCRAPER_API.key, 
        query: product,
        page: page,
      },
    });

    return formattedResponse(response.data, "Walmart");
    
  } catch (error) {
    console.log("catch fetchWalMartData error:", error?.message);
    return null;
  }
};

const fetchEbay = async (queryParams) => {
  try {
    const { product, page = 1 } = queryParams;
    
    const response = await axios.get(`https://${SCRAPER_API.host}/structured/ebay/search/v2`, {
      params: { 
        api_key: SCRAPER_API.key, 
        query: product,
        page: page,
        country_code: "us", 
      },
    });

    return formattedResponse(response.data, "eBay");
    
  } catch (error) {
    console.log("catch fetchEbay error:", error?.message);
    return null;
  }
};

// =========================================================================
// JSON Parsing/Mapping Functions
// =========================================================================

const formattedResponse = (data, domain) => {
    let rawProducts = [];
    let totalResults = 0;
    let country = domain === "Amazon" ? "IN" : "US";

    if (domain === "Amazon") {
        rawProducts = data.results || [];
        totalResults = rawProducts.length; 
    } else if (domain === "Walmart") {
        rawProducts = data.items || [];
        totalResults = rawProducts.length;
    } else if (domain === "eBay") {
        rawProducts = Array.isArray(data) ? data : data.results || []; 
        totalResults = rawProducts.length;
    }
    
    return {
        total_products: totalResults,
        country: country,
        domain: domain,
        products: formatProductResponse({ products: rawProducts, domain }),
    };
};

const formatProductResponse = ({ products, domain }) => {
    return products.map((p) => {
        let name, price, originalPrice, rating, image, url, id, reviews;

        if (domain === "Amazon") {
            id = p.asin;
            name = p.name;
            
            // FIX: Use price_string and clean it to avoid truncated price
            const priceStr = p.price_string || String(p.price || 0);
            price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0; 

            // Use original_price_string and clean it, or default to price for 0% off
            const originalPriceStr = p.original_price?.price_string || String(p.original_price?.price || price);
            originalPrice = parseFloat(originalPriceStr.replace(/[^0-9.]/g, '')) || price;
            
            rating = p.stars || 0;
            reviews = p.purchase_history_message || null; 
            image = p.image;
            url = p.url;

        } else if (domain === "Walmart") {
            id = p.id;
            name = p.name;
            // Walmart prices are in USD - CONVERT TO INR
            price = convertUsdToInr(p.price); 
            // Original price set to 0 to prevent strikethrough (0% off)
            originalPrice = 0; 
            rating = p.rating?.average_rating || 0;
            reviews = p.rating?.number_of_reviews || 0;
            image = p.image;
            url = p.url;

        } else if (domain === "eBay") {
            id = p.product_title?.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '') || `ebay-${Math.random()}`; 
            
            let rawPrice = 0;
            if (p.item_price?.from?.value) {
                // Price is a range (use the minimum 'from' value)
                rawPrice = p.item_price.from.value;
            } else if (p.item_price?.value) {
                // Price is a single value
                rawPrice = p.item_price.value;
            }
            
            // Check for massive or non-sensical prices before conversion
            if (rawPrice > 1000000) { 
                 rawPrice = 0;
            }
            
            // eBay prices are in USD - CONVERT TO INR
            price = convertUsdToInr(rawPrice);
            
            // Original price set to 0 to prevent strikethrough (0% off)
            originalPrice = 0; 
            
            // --- FIX: Create a composite string for reviews/ratings ---
            const sellerRatingCount = p.seller_rating_count ? p.seller_rating_count.toLocaleString() : null;
            const itemsSold = p.items_sold ? p.items_sold.toLocaleString() : null;
            const sellerName = p.seller_name;
            
            let reviewParts = [];
            
            // ADDED: "seller ratings" word
            if (sellerRatingCount) reviewParts.push(`${sellerRatingCount} seller ratings`);
            
            if (itemsSold) reviewParts.push(`Sold: ${itemsSold}`);
            if (sellerName) reviewParts.push(`Seller: ${sellerName}`);
            
            reviews = reviewParts.length > 0 ? reviewParts.join(' | ') : null;
            // Rating is explicitly 0 as no product rating is available
            rating = 0; 
            // -----------------------------------------------------------

            name = p.product_title?.replace(/Opens in a new window or tab/g, '').replace('New Listing', '').trim();
            image = p.image;
            url = p.product_url || p.item_url || `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(name)}`;
        }

        return {
            id: id,
            name: name || 'Product Name Not Found',
            price: parseFloat(price) || 0,
            originalPrice: parseFloat(originalPrice) || 0,
            rating: parseFloat(rating) || 0,
            no_of_rating: p.number_of_rating || 0,
            image: image,
            url: url,
            delivery: p.shipping_cost || "N/A", 
            source: domain,
            reviews: reviews || 0,
            inStock: p.availability?.toLowerCase() === 'in stock' || true,
        };
    });
};

const extractAsin = (query) => {
  return query.match(/[A-Z0-9]{10}/)?.[0] || query;
};