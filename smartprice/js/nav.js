// This script handles all global navigation bar functionality,
// including authentication state and dynamic link styling.

document.addEventListener('DOMContentLoaded', () => {
    
    // --- DYNAMIC ACTIVE LINK LOGIC ---
    const currentPageFile = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav .links a');
    navLinks.forEach(link => {
        const linkFile = link.getAttribute('href');
        link.classList.remove('active');
        if ((currentPageFile === '' || currentPageFile === 'index.html') && linkFile === 'index.html') {
            link.classList.add('active');
        } else if (linkFile === currentPageFile) {
            link.classList.add('active');
        }
    });

    // --- AUTHENTICATION & UI MANAGEMENT ---
    const authLink = document.getElementById('authLink');
    const profileMenu = document.getElementById('profileMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');

    const userInfo = JSON.parse(localStorage.getItem('pricePulseUser'));

    if (userInfo && userInfo.token) {
        // --- USER IS LOGGED IN ---
        if (authLink) authLink.style.display = 'none';
        if (profileMenu) profileMenu.style.display = 'list-item';
        
        if (dropdownUserEmail) {
            dropdownUserEmail.textContent = userInfo.email;
        }
        if (dropdownUserName && userInfo.name) {
            dropdownUserName.textContent = userInfo.name;
        }

    } else {
        // --- USER IS LOGGED OUT ---
        if (authLink) authLink.style.display = 'list-item';
        if (profileMenu) profileMenu.style.display = 'none';
    }

    // --- Profile Dropdown Toggle Logic ---
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            profileDropdown.classList.toggle('show');
        });
    }

    // --- Logout Button Logic ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('pricePulseUser');
            window.location.href = 'auth.html';
        });
    }
});

// --- Global Click Listener to Close the Profile Dropdown (THE FIX IS HERE) ---
window.onclick = function(event) {
  // This new condition checks if the click happened OUTSIDE of the entire .profile-menu element.
  // The .closest() method is the key. It looks at the clicked element and its parents.
  // If it can't find an ancestor with the class 'profile-menu', it means the click was outside.
  if (!event.target.closest('.profile-menu')) {
    const dropdowns = document.getElementsByClassName("profile-dropdown");
    for (let i = 0; i < dropdowns.length; i++) {
      let openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}