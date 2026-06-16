// ── Sidebar toggle ────────────────────────────────────────
const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

function toggleSidebar() {
  sidebar.classList.toggle('close');
  toggleButton.classList.toggle('rotate');
  closeAllSubMenus();
}

function toggleSubMenu(button) {
  if (!button.nextElementSibling.classList.contains('show')) {
    closeAllSubMenus();
  }
  button.nextElementSibling.classList.toggle('show');
  button.classList.toggle('rotate');
  if (sidebar.classList.contains('close')) {
    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');
  }
}

function closeAllSubMenus() {
  Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
    ul.classList.remove('show');
    ul.previousElementSibling.classList.remove('rotate');
  });
}

// ── Helpers ───────────────────────────────────────────────
function getInitials(name) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Auth guard + topbar ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const raw = localStorage.getItem('user');
  if (!raw) {
    window.location.href = '/pages/MainPage/Login.html';
    return;
  }

  let user;
  try {
    user = JSON.parse(raw);
  } catch {
    window.location.href = '/pages/MainPage/Login.html';
    return;
  }

  // Older topbar style (kept for any pages still using it)
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  if (avatarEl) avatarEl.textContent = getInitials(user.full_name);
  if (nameEl) nameEl.textContent = escHtml(user.full_name);

  // Dashboard page: personalised greeting
  const greetingEl = document.getElementById('dashboardGreeting');
  if (greetingEl) {
    const firstName = user.full_name.split(' ')[0];
    greetingEl.textContent = `Welcome back, ${escHtml(firstName)}`;
  }

  // ── Admin-style topbar (avatar initials, role badge, dropdown) ──
  const avatarInitialsEl = document.getElementById('avatarInitials');
  if (avatarInitialsEl) avatarInitialsEl.textContent = getInitials(user.full_name);

  const profileNameEl = document.getElementById('profileName');
  if (profileNameEl) profileNameEl.textContent = escHtml(user.full_name);

  const nameProfileEl = document.getElementById('NameProfile');
 if (nameProfileEl) nameProfileEl.textContent = escHtml(user.full_name);

  const profileAvatarEl = document.getElementById('profileAvatar');
  if (profileAvatarEl) profileAvatarEl.textContent = getInitials(user.full_name);

  const profileEmailEl = document.getElementById('profileEmail');
  if (profileEmailEl) profileEmailEl.textContent = escHtml(user.email);

  const roleBadgeEl = document.getElementById('roleBadge');
  if (roleBadgeEl) {
    if (user.role === 'admin') {
      roleBadgeEl.textContent = 'Admin';
      roleBadgeEl.classList.add('admin');
    } else {
      roleBadgeEl.textContent = 'Member';
      roleBadgeEl.classList.add('member');
    }
  }

  const profileContainer = document.getElementById('profileContainer');
  if (profileContainer) {
    profileContainer.addEventListener('click', e => {
      e.stopPropagation();
      profileContainer.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      profileContainer.classList.remove('open');
    });
  }

  const updateDataBtn = document.getElementById('updateDataBtn');
  if (updateDataBtn) {
    updateDataBtn.addEventListener('click', e => {
      e.stopPropagation();
      window.location.href = 'UpdateProfile.html';
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      if (e) e.stopPropagation();
      localStorage.removeItem('user');
      window.location.href = '/pages/MainPage/Login.html';
    });
  }
});