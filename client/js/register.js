document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const full_name = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const messageBox = document.getElementById('message');

    // reset message box
    messageBox.style.display = 'none';
    messageBox.textContent = '';

    let isValid = true;
    let errorMsg = '';

    // validate full name
    if (!full_name) {
        isValid = false;
        errorMsg = 'Please enter your full name.';
    }

    // validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (isValid && !emailRegex.test(email)) {
        isValid = false;
        errorMsg = 'Please enter a valid email address.';
    }

    // validate password length
    if (isValid && password.length < 6) {
        isValid = false;
        errorMsg = 'Password must be at least 6 characters.';
    }

    // validate passwords match
    if (isValid && password !== confirm_password) {
        isValid = false;
        errorMsg = 'Passwords do not match.';
    }

    if (!isValid) {
        messageBox.style.display = 'block';
        messageBox.style.background = 'rgba(220, 53, 69, 0.2)';
        messageBox.style.color = '#ff6b6b';
        messageBox.style.border = '1px solid rgba(220, 53, 69, 0.4)';
        messageBox.textContent = errorMsg;
        return;
    }

    // submit to backend
    try {
            const response = await fetch('/api/auth/register', {            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, password })
        });

        const data = await response.json();
        messageBox.style.display = 'block';

        if (response.ok) {
            messageBox.style.background = 'rgba(40, 167, 69, 0.2)';
            messageBox.style.color = '#51cf66';
            messageBox.style.border = '1px solid rgba(40, 167, 69, 0.4)';
            messageBox.textContent = data.message;
            document.getElementById('registerForm').reset();

            // redirect to member page after 1.5 seconds (SCRUM-78)
            setTimeout(() => {
                window.location.href = '../Member/Dashboard.html';
            }, 1500);

        } else {
            messageBox.style.background = 'rgba(220, 53, 69, 0.2)';
            messageBox.style.color = '#ff6b6b';
            messageBox.style.border = '1px solid rgba(220, 53, 69, 0.4)';
            messageBox.textContent = data.message;
        }

    } catch (error) {
        messageBox.style.display = 'block';
        messageBox.style.background = 'rgba(220, 53, 69, 0.2)';
        messageBox.style.color = '#ff6b6b';
        messageBox.style.border = '1px solid rgba(220, 53, 69, 0.4)';
        messageBox.textContent = 'Could not connect to server.';
    }
});
