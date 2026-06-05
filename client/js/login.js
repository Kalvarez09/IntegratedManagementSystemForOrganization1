document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageBox = document.getElementById('message');

    // reset message box
    messageBox.style.display = 'none';
    messageBox.textContent = '';

    let isValid = true;
    let errorMsg = '';

    // validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        isValid = false;
        errorMsg = 'Please enter a valid email address.';
    }

    // validate password not empty
    if (isValid && !password) {
        isValid = false;
        errorMsg = 'Please enter your password.';
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
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        messageBox.style.display = 'block';

        if (response.ok) {
            messageBox.style.background = 'rgba(40, 167, 69, 0.2)';
            messageBox.style.color = '#51cf66';
            messageBox.style.border = '1px solid rgba(40, 167, 69, 0.4)';
            messageBox.textContent = `Welcome back, ${data.member.full_name}!`;

            // redirect to member page after 1.5 seconds
            setTimeout(() => {
                window.location.href = '../pages/MemberPage.html';
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