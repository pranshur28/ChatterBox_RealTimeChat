document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value; // Added email field
        const password = document.getElementById('register-password').value;
        try {
            const response = await fetch('/api/auth/register', { // Updated endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }) // Include email in the request
            });
            const data = await response.json();
            if (response.ok) {
                alert('Registration successful!');
                localStorage.setItem('token', data.token);
                showChat();
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during registration');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value; // Changed to email field
        const password = document.getElementById('login-password').value;
        try {
            const response = await fetch('/api/auth/login', { // Updated endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }) // Include email in the request
            });
            const data = await response.json();
            if (response.ok) {
                alert('Login successful!');
                localStorage.setItem('token', data.token);
                showChat();
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login');
        }
    });

    function showChat() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
    }
});
