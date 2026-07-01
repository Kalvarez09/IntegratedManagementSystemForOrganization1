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

  const roleLabels = {
    admin:          'Admin',
    president:      'President',
    vice_president: 'Vice President',
    secretary:      'Secretary',
    treasurer:      'Treasurer',
    technical_lead: 'Technical Lead',
};
  if (roleBadgeEl) {
    const label = roleLabels[user.role] || 'Member';
    const cssClass = user.role in roleLabels ? user.role : 'member';
    roleBadgeEl.textContent = label;
    roleBadgeEl.classList.add(cssClass);
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
  const profileRoleBadge = document.getElementById('profileRoleBadge');

  if (profileRoleBadge) {
    const label = roleLabels[user.role] || 'Member';
    const cssClass = user.role in roleLabels ? user.role : 'member';
    profileRoleBadge.textContent = label;
    profileRoleBadge.classList.add(cssClass);
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
// ── Live dashboard data (Dashboard.html only) ──────────────
document.addEventListener('DOMContentLoaded', async () => {
    const activeVotesEl = document.querySelector('.dashboard-card .feed-list-placeholder');
    if (!document.querySelector('.dashboard-root')) return; // only run on Dashboard.html

    const [pollsRes, meetingsRes, docsRes] = await Promise.allSettled([
        fetch('/api/polls').then(r => r.json()),
        fetch('/api/meetings').then(r => r.json()),
        fetch('/api/documents').then(r => r.json())
    ]);

    // ── Pending Votes + Active Votes card ──
    const polls = pollsRes.status === 'fulfilled' ? (pollsRes.value.polls || []) : [];
    const pendingPolls = polls.filter(p => p.status === 'active' && !p.my_vote_option_id);

    const pendingCountEl = document.querySelector('.alert-card .metric-value');
    const pendingSubEl   = document.querySelector('.alert-card .card-subtitle');
    if (pendingCountEl) pendingCountEl.textContent = pendingPolls.length;
    if (pendingSubEl) {
        pendingSubEl.textContent = pendingPolls.length
            ? `${escHtml(pendingPolls[0].title)} closes ${new Date(pendingPolls[0].end_date).toLocaleDateString()}`
            : 'No pending votes right now';
    }

    const activeVotesList = document.querySelector('.dashboard-card.wide-card .feed-list-placeholder');
    if (activeVotesList) {
        activeVotesList.innerHTML = pendingPolls.length
            ? pendingPolls.map(p => `
                <li class="action-item">
                    <div>
                        <strong>${escHtml(p.title)}</strong>
                        <p>Status: <span class="text-live">Live</span></p>
                    </div>
                    <button class="action-btn" onclick="window.location.href='Voting.html'">Cast Vote</button>
                </li>`).join('')
            : `<li class="action-item"><div><strong>No active votes</strong><p>You're all caught up.</p></div></li>`;
    }

    // ── Upcoming Meetings ──
    const meetings = meetingsRes.status === 'fulfilled' ? (meetingsRes.value.meetings || []) : [];
    const now = new Date();
    const upcoming = meetings
        .filter(m => m.status === 'scheduled' && new Date(`${m.date}T${m.time}`) >= now)
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    const meetingCards = document.querySelectorAll('.stat-mini-card');
    const meetingCountEl = meetingCards[1]?.querySelector('.metric-value');
    const meetingSubEl   = meetingCards[1]?.querySelector('.card-subtitle');
    if (meetingCountEl) meetingCountEl.textContent = upcoming.length;
    if (meetingSubEl) {
        meetingSubEl.textContent = upcoming.length
            ? `Next: ${escHtml(upcoming[0].title)} (${new Date(`${upcoming[0].date}T${upcoming[0].time}`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})`
            : 'No upcoming meetings';
    }

    // ── Recently Added Documents ──
    const docs = docsRes.status === 'fulfilled' ? (docsRes.value.documents || []) : [];
    const recentDocs = [...docs]
        .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
        .slice(0, 2);

    const docCards = document.querySelectorAll('.dashboard-card.wide-card .feed-list-placeholder');
    const docsList = docCards[1]; // second wide-card is "Recently Added Documents"
    if (docsList) {
        docsList.innerHTML = recentDocs.length
            ? recentDocs.map(d => `
                <li class="action-item">
                    <div>
                        <strong>${escHtml(d.title || d.filename)}</strong>
                        <p>Uploaded: ${new Date(d.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <button class="action-btn outline-btn"
                        onclick="downloadDashboardDoc(${d.id}, '${escHtml(d.filename)}')">Download</button>
                </li>`).join('')
            : `<li class="action-item"><div><strong>No documents yet</strong></div></li>`;
    }
});

async function downloadDashboardDoc(docId, filename) {
    try {
        const res = await fetch(`/api/documents/download/${docId}`);
        if (!res.ok) { alert('Could not download this file.'); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    } catch {
        alert('Could not connect to server.');
    }
}

