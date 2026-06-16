const SECTIONS = {
    'data-migration': {
        icon: 'fas fa-database',
        title: '5.2 Data Preprocessing & Migration',
        scrum: 'SCRUM-6',
        desc: 'Tools for importing, cleaning, validating, and migrating organizational data into the system. Full functionality will be built in upcoming sprints.',
        features: ['Data Import', 'Data Validation', 'Migration Tools', 'Audit Logs']
    }
    ,
    
    'documents': {
        icon: 'fas fa-folder-open ',
        title: '5.3 Document Management System',
        scrum: 'SCRUM-7',
        desc: 'A centralized repository for storing, organizing, and securely sharing organizational documents. Full functionality will be built in upcoming sprints.',
        features: ['File Upload & Storage', 'Version Control', 'Access Permissions', 'Document Search']
    },
    'e-voting': {
        icon: 'fas fa-square-poll-vertical',
        title: '5.4 Electronic Voting System',
        scrum: 'SCRUM-8',
        desc: 'A secure and transparent system for conducting organizational elections and referendums online. Full functionality will be built in upcoming sprints.',
        features: ['Ballot Creation', 'Anonymous Voting', 'Real-time Results', 'Audit Trail']
    },
    'whatsapp': {
        icon: 'fab fa-whatsapp',
        title: '5.51 WhatsApp Analytics Features',
        scrum: 'SCRUM-9',
        desc: 'Analytics and insights derived from WhatsApp communication channels within the organization. Full functionality will be built in upcoming sprints.',
        features: ['Message Analytics', 'Engagement Metrics', 'Group Activity Reports', 'Trend Analysis']
    },
    'notifications': {
        icon: 'fas fa-bell',
        title: '5.5.2 Smart Notification Features',
        scrum: 'SCRUM-34',
        desc: 'Intelligent notification system to keep members informed about important updates and events. Full functionality will be built in upcoming sprints.',
        features: ['Push Notifications', 'Email Alerts', 'Custom Triggers', 'Notification Preferences']
    },
    'meetings': {
        icon: 'fas fa-users',
        title: '5.6 Meeting Management System',
        scrum: 'SCRUM-10',
        desc: 'Schedule, manage, and track organizational meetings with attendance and minutes recording. Full functionality will be built in upcoming sprints.',
        features: ['Meeting Scheduling', 'Attendance Tracking', 'Agenda Management', 'Minutes Recording']
    },
    'financial': {
        icon: 'fas fa-chart-line',
        title: '5.7 Financial Record Management',
        scrum: 'SCRUM-11',
        desc: 'Track and manage organizational finances, budgets, transactions, and financial reporting. Full functionality will be built in upcoming sprints.',
        features: ['Transaction Tracking', 'Budget Management', 'Financial Reports', 'Audit History']
    }
};

// --- Helpers ---

function getUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function getInitials(name) {
    return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

// --- Render home section ---

function renderHome(user) {
    const el = document.getElementById('section-home');
    const firstName = user.full_name.split(' ')[0];
    const isAdmin = user.role === 'admin';

    if (isAdmin) {
        el.innerHTML = `
            <h1 class="welcome-heading">Welcome back, ${escHtml(firstName)}</h1>
            <p class="welcome-sub">Here is your administration overview for today.</p>

            <div class="stats-grid">
                <div class="stat-card" id="memberCountCard">
                    <p class="stat-label">Total Members</p>
                    <p class="stat-value loading" id="memberCountVal">...</p>
                    <p class="stat-desc">Registered in the system</p>
                </div>
            </div>

            <div class="info-card">
                <h3 class="info-card-title"> More features are on the way</h3>
                <p class="info-card-body">
                    This is Sprint 1 of the Integrated Management System for Organization X.
                    The administration panel will expand with powerful tools across every module
                    as development progresses sprint by sprint. Stay tuned!
                </p>
                <div class="sprint-tags">
                    ${Object.values(SECTIONS).map(s =>
                        `<span class="sprint-tag">${s.scrum}: ${s.title}</span>`
                    ).join('')}
                </div>
            </div>
        `;
        loadMemberCount();
    } else {
        el.innerHTML = `
            <h1 class="welcome-heading">Welcome back, ${escHtml(firstName)}</h1>
            <p class="welcome-sub">Your member portal for Organization X.</p>

            <div class="info-card green" style="margin-bottom:20px;">
                <h3 class="info-card-title">Great to have you here!</h3>
                <p class="info-card-body">
                    This is the first sprint of your member portal. Right now you have access to your profile
                    and account settings. As the project evolves, more powerful tools will be unlocked for you
                    here — from electronic voting and document access to meeting schedules and financial transparency.
                </p>
            </div>

            <div class="info-card green">
                <h3 class="info-card-title">&#128640; Future functionalities will be added as sprints progress</h3>
                <p class="info-card-body">Here is a preview of what is being built for you:</p>
                <div class="sprint-tags">
                    ${Object.values(SECTIONS).map(s =>
                        `<span class="sprint-tag green">${s.scrum}: ${s.title}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
}

async function loadMemberCount() {
    try {
        const res = await fetch('/api/auth/members/count');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const el = document.getElementById('memberCountVal');
        if (el) {
            el.textContent = data.count.toLocaleString();
            el.classList.remove('loading');
        }
    } catch {
        const el = document.getElementById('memberCountVal');
        if (el) { el.textContent = '—'; el.classList.remove('loading'); }
    }
}

// --- Render future-module sections ---

function renderFutureSection(id) {
    const data = SECTIONS[id];
    if (!data) return;
    const el = document.getElementById(`section-${id}`);

    el.innerHTML = `
        <div class="section-hdr">
            <div class="section-icon-box"><i class="${data.icon}"></i></div>
            <div>
                <h1 class="section-title-text">${data.title}</h1>
                <p class="section-scrum-badge">${data.scrum}</p>
            </div>
        </div>
        <div class="coming-card">
            <div class="coming-icon-circle"><i class="${data.icon}"></i></div>
            <h2 class="coming-title">${data.title}</h2>
            <p class="coming-desc">${data.desc}</p>
            <div class="coming-badge">
                <i class="fas fa-clock"></i>
                Future functionalities will be added as sprints progress
            </div>
            <div class="feature-chips">
                ${data.features.map(f =>
                    `<span class="feature-chip"><i class="fas fa-circle-check"></i>${f}</span>`
                ).join('')}
            </div>
        </div>
    `;
}
//////////////MEMBERS TAB///////////////////
let allMembers = [];

async function renderMembersSection() {
    const data = SECTIONS['data-migration'];
    const el = document.getElementById('section-data-migration');

    el.innerHTML = `
    <div class="section-hdr">
        <div class="section-icon-box"><i class="${data.icon}"></i></div>
        <div>
            <h1 class="section-title-text">Members</h1>
            <p class="section-scrum-badge">${data.scrum} · Manage organization members</p>
        </div>
    </div>

    <div class="members-toolbar">
        <input type="text" id="memberSearch" class="member-search-input" placeholder="Search members by name or email...">
        <button class="action-btn outline-btn" id="uploadCsvBtn">
            <i class="fas fa-file-csv"></i> Upload CSV
        </button>
        <input type="file" id="csvFileInput" accept=".csv,.xlsx" hidden>
        <button class="action-btn" id="addMemberBtn">
            <i class="fas fa-user-plus"></i> Add Member
        </button>
    </div>

    <div id="uploadStatus" class="upload-status" hidden></div>

    <div class="members-table-wrapper">
        <table class="members-table">
            <thead>
                <tr>
                    <th>Member</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
                </tr>
            </thead>
            <tbody id="membersTableBody">
                <tr><td colspan="5" class="members-loading">Loading members...</td></tr>
            </tbody>
        </table>
    </div>

    <!-- Add Member Modal -->
    <div class="modal-overlay" id="addMemberModal" hidden>
        <div class="modal-card">
            <div class="modal-header">
                <h3>Add New Member</h3>
                <button class="modal-close" onclick="closeModal('addMemberModal')">✕</button>
            </div>
            <div id="addMemberError" class="upload-status error" hidden></div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="newMemberName" class="member-search-input" placeholder="e.g. John Smith" style="max-width:100%">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="newMemberEmail" class="member-search-input" placeholder="e.g. john@example.com" style="max-width:100%">
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="newMemberRole" class="member-search-input" style="max-width:100%">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="action-btn outline-btn" id="cancel-btn" onclick="closeModal('addMemberModal')">Cancel</button>
                <button class="action-btn" id="addMemberSubmitBtn" class="add-btn" onclick="submitAddMember()">Add Member</button>
            </div>
        </div>
    </div>

    <!-- Confirm Remove Modal -->
    <div class="modal-overlay" id="removeMemberModal" hidden>
        <div class="modal-card">
            <div class="modal-header">
                <h3>Remove Member</h3>
                <button class="modal-close" onclick="closeModal('removeMemberModal')">✕</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text-clr);margin-bottom:8px">Are you sure you want to remove <strong id="removeMemberName"></strong>?</p>
                <p style="color:var(--secondary-text-clr);font-size:0.85rem">This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button class="action-btn outline-btn" id="cancel-SubmitBtn" onclick="closeModal('removeMemberModal')">Cancel</button>
                <button class="danger-btn" id="confirmRemoveBtn">Remove</button>
            </div>
        </div>
    </div>
`;

    document.getElementById('uploadCsvBtn').addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });

    document.getElementById('addMemberBtn').addEventListener('click', () => {
    openModal('addMemberModal');
    }); 

    document.getElementById('csvFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showUploadStatus('Validating file...', 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/auth/upload-members', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            showUploadStatus(`${data.message} (${data.rowCount} rows)`, 'success');
        } else {
            showUploadStatus(data.message, 'error', data.errors);
        }
    } catch {
        showUploadStatus('Could not connect to server.', 'error');
    }

    e.target.value = '';
});

    function showUploadStatus(message, type, errors = null) {
    const el = document.getElementById('uploadStatus');
    el.className = `upload-status ${type}`;
    let html = `<p>${escHtml(message)}</p>`;
    if (errors && errors.length > 0) {
        html += `<ul>${errors.map(e => `<li>${escHtml(e)}</li>`).join('')}</ul>`;
    }
    el.innerHTML = html;
    el.hidden = false;
}

    document.getElementById('memberSearch').addEventListener('input', e => {
        filterMembers(e.target.value);
    });

    await loadMembers();
}

async function loadMembers() {
    const tbody = document.getElementById('membersTableBody');
    try {
        const res = await fetch('/api/auth/members');
        if (!res.ok) throw new Error();
        const data = await res.json();
        allMembers = data.members;
        renderMemberRows(allMembers);
    } catch {
        tbody.innerHTML = `<tr><td colspan="4" class="members-loading">Could not load members.</td></tr>`;
    }
}

function renderMemberRows(members) {
    const tbody = document.getElementById('membersTableBody');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (members.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="members-loading">No members found.</td></tr>`;
        return;
    }

    tbody.innerHTML = members.map(m => `
        <tr>
            <td>
                <div class="member-cell">
                    <div class="member-avatar-sm">${getInitials(m.full_name)}</div>
                    <span>${escHtml(m.full_name)}</span>
                </div>
            </td>
            <td>${escHtml(m.email)}</td>
            <td><span class="role-pill ${m.role}">${m.role}</span></td>
            <td>${new Date(m.created_at).toLocaleDateString()}</td>
            <td>
                <button
                    class="tbl-action-btn delete"
                    onclick="confirmRemove(${m.id}, '${escHtml(m.full_name)}')"
                    ${String(m.id) === String(currentUser.id) ? 'disabled title="Cannot remove your own account"' : ''}
                >
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}
function openModal(id) {
    document.getElementById(id).hidden = false;
}

function closeModal(id) {
    document.getElementById(id).hidden = true;
}

function confirmRemove(memberId, memberName) {
    document.getElementById('removeMemberName').textContent = memberName;
    document.getElementById('confirmRemoveBtn').onclick = () => executeRemove(memberId);
    openModal('removeMemberModal');
}

async function executeRemove(memberId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    closeModal('removeMemberModal');

    try {
        const res = await fetch(`/api/auth/members/${memberId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestingUserId: user.id })
        });
        const data = await res.json();
        showUploadStatus(data.message, res.ok ? 'success' : 'error');
        if (res.ok) await loadMembers();
    } catch {
        showUploadStatus('Could not connect to server.', 'error');
    }
}

async function submitAddMember() {
    const full_name = document.getElementById('newMemberName').value.trim();
    const email    = document.getElementById('newMemberEmail').value.trim();
    const role     = document.getElementById('newMemberRole').value;
    const errorEl  = document.getElementById('addMemberError');
    const submitBtn = document.getElementById('addMemberSubmitBtn');

    errorEl.hidden = true;

    if (!full_name || !email) {
        errorEl.textContent = 'Full name and email are required.';
        errorEl.hidden = false;
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
        const res = await fetch('/api/auth/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, role })
        });
        const data = await res.json();

        if (res.ok) {
            closeModal('addMemberModal');
            document.getElementById('newMemberName').value = '';
            document.getElementById('newMemberEmail').value = '';
            document.getElementById('newMemberRole').value = 'member';
            showUploadStatus(data.message, 'success');
            await loadMembers();
        } else {
            errorEl.textContent = data.message;
            errorEl.hidden = false;
        }
    } catch {
        errorEl.textContent = 'Could not connect to server.';
        errorEl.hidden = false;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Member';
}

function filterMembers(query) {
    const q = query.toLowerCase();
    renderMemberRows(allMembers.filter(m =>
        m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    ));
}

// --- Navigation ---

function navigate(sectionId) {
    // Active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });

    // Show target section, hide others
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.classList.add('active');

    // Page title
    const title = sectionId === 'home' ? 'Dashboard' : (SECTIONS[sectionId]?.title ?? 'Dashboard');
    document.getElementById('pageTitle').textContent = title;

    document.getElementById('contentArea').scrollTop = 0;
}

// --- Sidebar toggle ---

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const wrapper = document.getElementById('mainWrapper');
    const btn = document.getElementById('collapseBtn');

    btn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        wrapper.classList.toggle('sidebar-collapsed');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            navigate(item.dataset.section);
        });
    });
}

// --- Profile dropdown ---

function initProfile() {
    const container = document.getElementById('profileContainer');

    container.addEventListener('click', e => {
        e.stopPropagation();
        container.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        container.classList.remove('open');
    });

    document.getElementById('updateDataBtn').addEventListener('click', e => {
        e.stopPropagation();
        window.location.href = '../Member/UpdateProfile.html';
    });

    document.getElementById('logoutBtn').addEventListener('click', e => {
        e.stopPropagation();
        localStorage.removeItem('user');
        window.location.href = '/pages/Member/Dashboard.html';
    });
}

// --- Bootstrap ---

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (!user) {
        window.location.href = '../MainPage/Login.html';
        return;
    }

    // Profile bar
    document.getElementById('avatarInitials').textContent = getInitials(user.full_name);
    document.getElementById('profileName').textContent = user.full_name;

    const badge = document.getElementById('roleBadge');
    if (user.role === 'admin') {
        badge.textContent = 'Admin';
        badge.classList.add('admin');
    } else {
        badge.textContent = 'Member';
        badge.classList.add('member');
    }

    // Render all sections
    renderHome(user);

    Object.keys(SECTIONS)
        .filter(id => id !== 'data-migration')
        .forEach(renderFutureSection);

    renderMembersSection();

    // Init interactions
    initSidebar();
    initProfile();

    // Show home
    navigate('home');
});
