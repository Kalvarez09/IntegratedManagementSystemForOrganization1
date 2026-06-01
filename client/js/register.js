document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const full_name = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const messageBox = document.getElementById('message');

    // Reset validation
    document.querySelectorAll('.form-control').forEach(el => {
        el.classList.remove('is-invalid', 'is-valid');
    });

    let isValid = true;

    // Validate full name
    if (!full_name) {
        document.getElementById('full_name').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('full_name').classList.add('is-valid');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('email').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('email').classList.add('is-valid');
    }

    // Validate password length
    if (password.length < 6) {
        document.getElementById('password').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('password').classList.add('is-valid');
    }

    // Validate confirm password
    if (password !== confirm_password) {
        document.getElementById('confirm_password').classList.add('is-invalid');
        document.getElementById('confirm-feedback').textContent = 'Passwords do not match.';
        isValid = false;
    } else if (!confirm_password) {
        document.getElementById('confirm_password').classList.add('is-invalid');
        document.getElementById('confirm-feedback').textContent = 'Please confirm your password.';
        isValid = false;
    } else {
        document.getElementById('confirm_password').classList.add('is-valid');
    }

    if (!isValid) return;

    // Submit to backend
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, password })
        });

        const data = await response.json();
        messageBox.classList.remove('d-none', 'alert-danger', 'alert-success');

        if (response.ok) {
            messageBox.classList.add('alert-success');
            messageBox.textContent = '✅ ' + data.message;
            document.getElementById('registerForm').reset();
            document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-valid'));
        } else {
            messageBox.classList.add('alert-danger');
            messageBox.textContent = '❌ ' + data.message;
        }

    } catch (error) {
        messageBox.classList.remove('d-none');
        messageBox.classList.add('alert-danger');
        messageBox.textContent = '❌ Could not connect to server.';
    }
});