function getUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

window.addEventListener('load', () => {
    const user = getUser();
    if (!user) { window.location.href = '/pages/Login.html'; return; }

    document.getElementById('profileName').textContent = user.full_name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('avatarInitial').textContent = user.full_name.charAt(0).toUpperCase();
    document.getElementById('full_name').value = user.full_name;
    document.getElementById('email').value = user.email;
});

function showSection(sectionId, btn) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('open'));
    document.querySelectorAll('.btn-action').forEach(b => b.classList.remove('active'));
    document.getElementById(sectionId).classList.add('open');
    btn.classList.add('active');
}

function showSuccess(msg) {
    const el = document.getElementById('successMsg');
    document.getElementById('errorMsg').style.display = 'none';
    el.textContent = '✅ ' + msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

function showError(msg) {
    const el = document.getElementById('errorMsg');
    document.getElementById('successMsg').style.display = 'none';
    el.textContent = '❌ ' + msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

function goBack() {
    window.location.href = '/pages/Dashboard.html';
}

async function saveName() {
    const full_name = document.getElementById('full_name').value.trim();
    const nameError = document.getElementById('nameError');
    document.getElementById('full_name').classList.remove('is-invalid');
    nameError.textContent = '';

    if (!full_name) {
        document.getElementById('full_name').classList.add('is-invalid');
        nameError.textContent = 'Please enter your full name.';
        return;
    }
    await sendUpdate({ full_name, updateType: 'name' });
}

async function saveEmail() {
    const email = document.getElementById('email').value.trim();
    const emailError = document.getElementById('emailError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    document.getElementById('email').classList.remove('is-invalid');
    emailError.textContent = '';

    if (!emailRegex.test(email)) {
        document.getElementById('email').classList.add('is-invalid');
        emailError.textContent = 'Please enter a valid email.';
        return;
    }
    await sendUpdate({ email, updateType: 'email' });
}

async function savePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
        document.getElementById(id).classList.remove('is-invalid');
    });

    let isValid = true;
    if (!currentPassword) {
        document.getElementById('currentPassword').classList.add('is-invalid');
        document.getElementById('currentPwError').textContent = 'Current password is required.';
        isValid = false;
    }
    if (newPassword.length < 6) {
        document.getElementById('newPassword').classList.add('is-invalid');
        document.getElementById('newPwError').textContent = 'Min. 6 characters required.';
        isValid = false;
    }
    if (newPassword !== confirmPassword) {
        document.getElementById('confirmPassword').classList.add('is-invalid');
        document.getElementById('confirmPwError').textContent = 'Passwords do not match.';
        isValid = false;
    }
    if (!isValid) return;

    await sendUpdate({ currentPassword, newPassword, updateType: 'password' });
}

async function sendUpdate(payload) {
    const user = getUser();
    if (!user) { window.location.href = '/pages/Login.html'; return; }

    const data = {
        userId: user.id,
        full_name: payload.full_name || user.full_name,
        email: payload.email || user.email,
        currentPassword: payload.currentPassword || null,
        newPassword: payload.newPassword || null,
        updateType: payload.updateType
    };

    try {
        const response = await fetch('/api/auth/update-profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            const updated = { ...user };
            if (payload.updateType === 'name') {
                updated.full_name = data.full_name;
                document.getElementById('profileName').textContent = data.full_name;
                document.getElementById('avatarInitial').textContent = data.full_name.charAt(0).toUpperCase();
            }
            if (payload.updateType === 'email') {
                updated.email = data.email;
                document.getElementById('profileEmail').textContent = data.email;
            }
            localStorage.setItem('user', JSON.stringify(updated));

            showSuccess(result.message);
            document.querySelectorAll('.form-section.open').forEach(s => s.classList.remove('open'));
            document.querySelectorAll('.btn-action.active').forEach(b => b.classList.remove('active'));
        } else {
            showError(result.message);
        }
    } catch {
        showError('Could not connect to server.');
    }
}
