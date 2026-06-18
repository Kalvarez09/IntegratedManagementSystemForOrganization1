function showMessage(boxId, msg, isError) {
    const box = document.getElementById(boxId);
    box.style.display = 'block';
    box.style.padding = '10px';
    box.style.borderRadius = '10px';
    box.style.fontSize = '1.1em';
    if (isError) {
        box.style.background = 'rgba(220,53,69,0.2)';
        box.style.color = '#ff6b6b';
        box.style.border = '1px solid rgba(220,53,69,0.4)';
    } else {
        box.style.background = '#28a74533';
        box.style.color = '#51cf66';
        box.style.border = '1px solid rgba(40,167,69,0.4)';
    }
    box.textContent = msg;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageBox = document.getElementById('message');

    messageBox.style.display = 'none';
    messageBox.textContent = '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('message', 'Please enter a valid email address.', true);
        return;
    }

    if (!password) {
        showMessage('message', 'Please enter your password.', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.status === 'otp_required') {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('otpStep').style.display = 'block';
                return;
            }

            showMessage('message', `Welcome back, ${data.member.full_name}!`, false);

            localStorage.setItem('user', JSON.stringify({
                id: data.member.id,
                full_name: data.member.full_name,
                email: data.member.email,
                role: data.member.role || 'member'
            }));

            const role = data.member.role || 'member';
            setTimeout(() => {
                window.location.href = role === 'admin'
                    ? '/pages/Admin/Dashboard.html'
                    : '/pages/Member/Dashboard.html';
            }, 1500);

        } else {
            showMessage('message', data.message, true);
        }

    } catch (error) {
        showMessage('message', 'Could not connect to server.', true);
    }
});

async function verifyOtp() {
    const token = document.getElementById('otpCode').value.trim();

    if (!/^\d{6}$/.test(token)) {
        showMessage('otpMessage', 'Please enter the 6-digit code from your authenticator app.', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/2fa/verify-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('otpMessage', 'Verified! Redirecting...', false);

            localStorage.setItem('user', JSON.stringify({
                id: data.member.id,
                full_name: data.member.full_name,
                email: data.member.email,
                role: data.member.role || 'member'
            }));

            const role = data.member.role || 'member';
            setTimeout(() => {
                window.location.href = role === 'admin'
                    ? '/pages/Admin/Dashboard.html'
                    : '/pages/Member/Dashboard.html';
            }, 1000);

        } else {
            showMessage('otpMessage', data.message, true);
        }

    } catch (error) {
        showMessage('otpMessage', 'Could not connect to server.', true);
    }
}
