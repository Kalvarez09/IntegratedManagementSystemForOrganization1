// Load current user data
window.addEventListener('load', () => {
    const name = localStorage.getItem('user_name') || '';
    const email = localStorage.getItem('user_email') || '';

    document.getElementById('profileName').textContent = name;
    document.getElementById('profileEmail').textContent = email;
    document.getElementById('avatarInitial').textContent = name.charAt(0).toUpperCase();
    document.getElementById('full_name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('currentNameDisplay').textContent = 'Current: ' + name;
    document.getElementById('currentEmailDisplay').textContent = 'Current: ' + email;
});

function showSection(sectionId, btn) {
    // Close all sections
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('open'));
    document.querySelectorAll('.btn-action').forEach(b => b.classList.remove('active'));

    // Open clicked section
    document.getElementById(sectionId).classList.add('open');
    btn.classList.add('active');
}

// Show messages
function showSuccess(msg) {
    const el = document.getElementById('successMsg');
    const err = document.getElementById('errorMsg');
    err.style.display = 'none';
    el.textContent = '✅ ' + msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

function showError(msg) {
    const el = document.getElementById('errorMsg');
    const suc = document.getElementById('successMsg');
    suc.style.display = 'none';
    el.textContent = '❌ ' + msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

// Go back to dashboard
function goBack() {
    const role = localStorage.getItem('user_role');
    window.location.href = role === 'admin' ? '/ADMIN/index.html' : '/pages/MemberPage.html';
}

// Save Name only
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

// Save Email only
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

// Save Password only
async function savePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Reset
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

// Send update to backend
async function sendUpdate(payload) {
    const userId = localStorage.getItem('user_id');

    // Fill missing fields with current values
    const data = {
        userId,
        full_name: payload.full_name || localStorage.getItem('user_name'),
        email: payload.email || localStorage.getItem('user_email'),
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
            // Update localStorage
            if (data.full_name) {
                localStorage.setItem('user_name', data.full_name);
                document.getElementById('profileName').textContent = data.full_name;
                document.getElementById('avatarInitial').textContent = data.full_name.charAt(0).toUpperCase();
                document.getElementById('currentNameDisplay').textContent = 'Current: ' + data.full_name;
            }
            if (data.email) {
                localStorage.setItem('user_email', data.email);
                document.getElementById('profileEmail').textContent = data.email;
                document.getElementById('currentEmailDisplay').textContent = 'Current: ' + data.email;
            }

            showSuccess(result.message);

            // Close the section after saving
            document.querySelectorAll('.section-body.open').forEach(s => s.classList.remove('open'));

        } else {
            showError(result.message);
        }

    } catch (error) {
        showError('Could not connect to server.');
    }
}