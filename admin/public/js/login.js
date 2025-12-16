document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Signing in...</span>';
        errorMessage.classList.remove('show');
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Redirect to dashboard
                window.location.href = '/admin';
            } else {
                errorMessage.textContent = data.message || 'Invalid credentials';
                errorMessage.classList.add('show');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.classList.add('show');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});

