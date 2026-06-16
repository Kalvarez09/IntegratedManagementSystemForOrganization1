document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageBox = document.getElementById('message');

    messageBox.style.display = 'none';
    messageBox.textContent = '';

    let isValid = true;
    let errorMsg = '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        isValid = false;
        errorMsg = 'Please enter a valid email address.';
    }

    if (isValid && !password) {
        isValid = false;
        errorMsg = 'Please enter your password.';
    }

    if (!isValid) {
        messageBox.style.display = 'block';
        messageBox.style.background = '#dc354533';
        messageBox.style.color = '#ff6b6b';
        messageBox.style.border = '1px solid #dc354566';
        messageBox.style.padding = '10px';
        messageBox.style.borderRadius = '10px';
        messageBox.style.fontSize = '1.2em';
        messageBox.textContent = errorMsg;
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        messageBox.style.display = 'block';

        if (response.ok) {
            messageBox.style.background = '#28a74533';
            messageBox.style.color = '#51cf66';
            messageBox.style.border = '1px solid rgba(40, 167, 69, 0.4)';
            messageBox.style.padding = '10px';
            messageBox.style.borderRadius = '10px';
            messageBox.style.fontSize = '1.2em';
            messageBox.textContent = `Welcome back, ${data.member.full_name}!`;

            localStorage.setItem('user', JSON.stringify({
                id: data.member.id,
                full_name: data.member.full_name,
                email: data.member.email,
                role: data.member.role || 'member'
            }));

            const role = data.member.role || 'member';
            const destination = role === 'admin'
                ? '/pages/Admin/Dashboard.html'
                : '/pages/Member/Dashboard.html';

            setTimeout(() => {
                window.location.href = destination;
            }, 1500);

        } else {
            messageBox.style.background = 'rgba(220, 53, 69, 0.2)';
            messageBox.style.color = '#ff6b6b';
            messageBox.style.border = '1px solid rgba(220, 53, 69, 0.4)';
            messageBox.style.padding = '10px';
            messageBox.style.borderRadius = '10px';
            messageBox.style.fontSize = '1.2em';
            messageBox.textContent = data.message;
        }

    } catch (error) {
        messageBox.style.display = 'block';
        messageBox.style.background = 'rgba(220, 53, 69, 0.2)';
        messageBox.style.color = '#ff6b6b';
        messageBox.style.border = '1px solid rgba(220, 53, 69, 0.4)';
        messageBox.style.padding = '10px';
        messageBox.style.borderRadius = '10px';
        messageBox.style.fontSize = '1.2em';
        messageBox.textContent = 'Could not connect to server.';
    }
});
