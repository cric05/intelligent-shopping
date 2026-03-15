// This script will run on every protected page.

// 1. Get user information from localStorage
const userInfo = JSON.parse(localStorage.getItem('pricePulseUser'));

// 2. Check if user info or token is missing
if (!userInfo || !userInfo.token) {
    // 3. If missing, redirect to the login page
    // Using replace() is better because it prevents the user from clicking the "back" button to a protected page.
    window.location.replace('auth.html'); 
}