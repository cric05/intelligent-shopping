document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    const passwordToggles = document.querySelectorAll('.toggle-password');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');

    // --- Backend API URL ---
    // Make sure your backend server is running on this port
    // Update this line in your VS Code:
const API_URL = 'https://intelligent-shopping.onrender.com/api/auth';


    
    // --- Event Listener for the "Sign In" Form ---
    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop the page from reloading
            
            const email = signInForm.querySelector('input[type="email"]').value;
            const password = signInForm.querySelector('input[type="password"]').value;

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    // If the server returns an error (e.g., 401 Unauthorized), throw an error
                    throw new Error(data.message || 'Invalid email or password');
                }

                // SUCCESS: Save user data and redirect
                localStorage.setItem('pricePulseUser', JSON.stringify(data));
                window.location.href = 'index.html';

            } catch (error) {
                // Display the error message to the user
                alert(error.message); 
            }
        });
    }

    // --- Event Listener for the "Sign Up" Form ---
if (signUpForm) {
    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the page from reloading
        
        // Get the values from the specific input fields
        const name = document.getElementById('signUpName').value;
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send the name, email, and password to the backend
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Could not create account');
            }

            // SUCCESS: Save user data (which now includes the name) and redirect
            localStorage.setItem('pricePulseUser', JSON.stringify(data));
            window.location.href = 'index.html';

        } catch (error) {
             // Display the error message to the user
            alert(error.message);
        }
    });
}


    // --- UI Logic for Sliding Panels and Password Toggle ---
    if (signUpButton) {
        signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
    }

    if (signInButton) {
        signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
    }

    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggle.classList.toggle('fa-eye');
            toggle.classList.toggle('fa-eye-slash');
        });
    });
});