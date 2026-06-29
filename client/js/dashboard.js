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
//////////MEMBER ROLES////////////
const roleLabels  = {
        admin:          'Admin',
        president:      'President',
        vice_president: 'Vice President',
        secretary:      'Secretary',
        treasurer:      'Treasurer',
        technical_lead: 'Technical Lead',
        member:         'Member',
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
    <div id="importAction" style="display:none; align-items:center; gap:10px; margin-top:14px;">
        <button id="confirmImportBtn" style="
            background: linear-gradient(135deg, #064e3b, #059669);
            border: 1px solid #10b98166;
            border-radius: 8px;
            padding: 10px 20px;
            color: #ecfdf5;
            font-family: monospace;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 0 14px #10b98133, inset 0 1px 0 #10b98122;
            transition: box-shadow 0.2s, transform 0.1s;
        " onmouseover="this.style.boxShadow='0 0 22px #10b98155, inset 0 1px 0 #10b98122'"
           onmouseout="this.style.boxShadow='0 0 14px #10b98133, inset 0 1px 0 #10b98122'">
            <i class="fas fa-file-import"></i>
            <span id="confirmImportLabel">Import</span>
        </button>
        <button id="cancelImportBtn" style="
            background: #0b1523;
            border: 1px solid #16263b;
            border-radius: 8px;
            padding: 10px 18px;
            color: #94a3b8;
            font-family: monospace;
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: border-color 0.2s, color 0.2s;
        " onmouseover="this.style.borderColor='#334155';this.style.color='#f1f5f9'"
           onmouseout="this.style.borderColor='#16263b';this.style.color='#94a3b8'">
            <i class="fas fa-times"></i> Cancel
        </button>
    </div>

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
                        <option value="member">General Member</option>
                        <option value="admin">Admin</option>
                        <option value="president">President</option>
                        <option value="vice_president">Vice President</option>
                        <option value="secretary">Secretary</option>
                        <option value="treasurer">Treasurer</option>
                        <option value="technical_lead">Technical Lead</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="danger-btn outline-btn"  onclick="closeModal('addMemberModal')">Cancel</button>
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

    let pendingImportRows = [];

    function showImportButton(count) {
        document.getElementById('confirmImportLabel').textContent = `Import ${count} row(s)`;
        document.getElementById('importAction').style.display = 'flex';
    }

    function hideImportButton() {
        document.getElementById('importAction').style.display = 'none';
        pendingImportRows = [];
    }

    document.getElementById('cancelImportBtn').addEventListener('click', () => {
        hideImportButton();
        document.getElementById('uploadStatus').hidden = true;
    });

    document.getElementById('confirmImportBtn').addEventListener('click', async () => {
        if (!pendingImportRows.length) return;
        const btn = document.getElementById('confirmImportBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';

        try {
            const res = await fetch('/api/auth/import-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: pendingImportRows })
            });
            const data = await res.json();
            hideImportButton();
            showUploadStatus(data.message, data.summary?.failed?.length > 0 ? 'error' : 'success',
                null, null, null, data.summary);
            if (data.summary?.inserted?.length > 0) await loadMembers();
        } catch {
            showUploadStatus('Could not connect to server.', 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-file-import"></i> <span id="confirmImportLabel">Import</span>';
    });

    document.getElementById('csvFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    hideImportButton();
    showUploadStatus('Validating file...', 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/auth/upload-members', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            const hasIssues = (data.duplicates?.length > 0) || (data.missingRows?.length > 0);
            showUploadStatus(data.message, hasIssues ? 'error' : 'success', null, data.duplicates, data.missingRows, data.standardizedRows);
            if (data.standardizedRows?.length > 0) {
                pendingImportRows = data.standardizedRows;
                showImportButton(data.standardizedRows.length);
            }
        } else {
            showUploadStatus(data.message, 'error', data.errors, data.duplicates, data.missingRows);
        }
    } catch {
        showUploadStatus('Could not connect to server.', 'error');
    }

    e.target.value = '';
});

   

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
            <td>
                <span
                    class="role-pill ${m.role} clickable-role"
                    onclick="openRoleEditor(this, ${m.id}, '${m.role}')"
                    title="Click to change role"
                >${roleLabels[m.role] || m.role}</span>
            </td>
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
function openRoleEditor(pillEl, memberId, currentRole) {
    const VALID_ROLES = ['member', 'admin', 'president', 'vice_president', 'secretary', 'treasurer', 'technical_lead'];

    const select = document.createElement('select');
    select.className = 'role-inline-select';

    VALID_ROLES.forEach(r => {
        const option = document.createElement('option');
        option.value = r;
        option.textContent = roleLabels[r] || r;
        if (r === currentRole) option.selected = true;
        select.appendChild(option);
    });

    pillEl.replaceWith(select);
    select.focus();

    async function commitChange() {
        const newRole = select.value;
        if (newRole === currentRole) {
            select.replaceWith(pillEl);
            return;
        }

        try {
            const res = await fetch(`/api/auth/members/${memberId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();

            if (res.ok) {
                showUploadStatus(`Role updated to ${roleLabels[newRole]}.`, 'success');
                await loadMembers();
            } else {
                showUploadStatus(data.message, 'error');
                select.replaceWith(pillEl);
            }
        } catch {
            showUploadStatus('Could not connect to server.', 'error');
            select.replaceWith(pillEl);
        }
    }

    select.addEventListener('change', commitChange);
    select.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== select) {
                select.replaceWith(pillEl);
            }
        }, 150);
    });
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
 function showUploadStatus(message, type, errors = null, duplicates = null, missingRows = null, summary = null) {
    const el = document.getElementById('uploadStatus');
    el.className = `upload-status ${type}`;

    const sectionStyle = 'margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.15);';
    const labelStyle   = 'font-weight:700; font-size:0.8rem; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:6px;';
    const listStyle    = 'margin:4px 0 0 0; padding-left:18px;';
    const itemStyle    = 'margin-bottom:2px; font-size:0.85rem;';
    const tableStyle   = 'width:100%; border-collapse:collapse; font-size:0.82rem;';
    const thStyle      = 'text-align:left; padding:4px 8px; font-weight:600; opacity:0.75;';
    const tdStyle      = 'padding:4px 8px;';

    let html = `<p style="font-weight:600; margin-bottom:4px;">${escHtml(message)}</p>`;

    // Validation errors
    if (errors && errors.length > 0) {
        html += `<div style="${sectionStyle}">`;
        html += `<p style="${labelStyle}">Validation errors (${errors.length})</p>`;
        html += `<ul style="${listStyle}">${errors.map(e => `<li style="${itemStyle}">${escHtml(e)}</li>`).join('')}</ul>`;
        html += `</div>`;
    }

    // Duplicates removed
    if (duplicates && duplicates.length > 0) {
        html += `<div style="${sectionStyle}">`;
        html += `<p style="${labelStyle}">Duplicates removed (${duplicates.length})</p>`;
        html += `<ul style="${listStyle}">${duplicates.map(d =>
            `<li style="${itemStyle}">Row ${d.row}: <strong>${escHtml(d.email)}</strong> — ${escHtml(d.reason)}</li>`
        ).join('')}</ul>`;
        html += `</div>`;
    }

    // Missing required fields
    if (missingRows && missingRows.length > 0) {
        html += `<div style="${sectionStyle}">`;
        html += `<p style="${labelStyle}">Rows skipped — missing required fields (${missingRows.length})</p>`;
        html += `<ul style="${listStyle}">${missingRows.map(r =>
            `<li style="${itemStyle}">Row ${r.row}: missing <strong>${r.fields.map(f => escHtml(f)).join(', ')}</strong></li>`
        ).join('')}</ul>`;
        html += `</div>`;
    }

    // Preview table (before import) — standardizedRows passed as summary when it's an array
    if (Array.isArray(summary) && summary.length > 0) {
        html += `<div style="${sectionStyle}">`;
        html += `<p style="${labelStyle} color:#4ade80;">Data ready to import (${summary.length} rows)</p>`;
        html += `<div style="max-height:220px; overflow-y:auto; overflow-x:auto; border-radius:6px;">
            <table style="${tableStyle} color:#4ade80;">
                <thead><tr style="border-bottom:1px solid rgba(74,222,128,0.3); position:sticky; top:0; background:#0b1a2e;">
                    <th style="${thStyle}">#</th>
                    <th style="${thStyle}">Full Name</th>
                    <th style="${thStyle}">Email</th>
                    <th style="${thStyle}">Role</th>
                </tr></thead>
                <tbody>${summary.map((r, i) => `
                    <tr style="border-bottom:1px solid rgba(74,222,128,0.1);">
                        <td style="${tdStyle} opacity:0.6;">${i + 1}</td>
                        <td style="${tdStyle}">${escHtml(r.full_name)}</td>
                        <td style="${tdStyle}">${escHtml(r.email)}</td>
                        <td style="${tdStyle}">${escHtml(r.role || 'member')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
        html += `</div>`;
    }

    // Import result summary (after import)
    if (summary && !Array.isArray(summary)) {
        // Successfully inserted — green table
        if (summary.inserted?.length > 0) {
            html += `<div style="${sectionStyle}">`;
            html += `<p style="${labelStyle} color:#4ade80;">Successfully imported (${summary.inserted.length})</p>`;
            html += `<div style="max-height:220px; overflow-y:auto; overflow-x:auto; border-radius:6px;">
                <table style="${tableStyle} color:#4ade80;">
                    <thead><tr style="border-bottom:1px solid rgba(74,222,128,0.3); position:sticky; top:0; background:#0b1a2e;">
                        <th style="${thStyle}">#</th>
                        <th style="${thStyle}">Full Name</th>
                        <th style="${thStyle}">Email</th>
                        <th style="${thStyle}">Role</th>
                    </tr></thead>
                    <tbody>${summary.inserted.map((r, i) => `
                        <tr style="border-bottom:1px solid rgba(74,222,128,0.1);">
                            <td style="${tdStyle} opacity:0.6;">${i + 1}</td>
                            <td style="${tdStyle}">${escHtml(r.full_name)}</td>
                            <td style="${tdStyle}">${escHtml(r.email)}</td>
                            <td style="${tdStyle}">${escHtml(r.role)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
            html += `</div>`;
        }

        // Skipped at DB level — orange
        if (summary.skipped?.length > 0) {
            html += `<div style="${sectionStyle}">`;
            html += `<p style="${labelStyle} color:#fb923c;">Skipped at import (${summary.skipped.length})</p>`;
            html += `<ul style="${listStyle}">${summary.skipped.map(r =>
                `<li style="${itemStyle} color:#fb923c;"><strong>${escHtml(r.full_name)}</strong> (${escHtml(r.email)}) — ${escHtml(r.reason)}</li>`
            ).join('')}</ul>`;
            html += `</div>`;
        }

        // Failed — red
        if (summary.failed?.length > 0) {
            html += `<div style="${sectionStyle}">`;
            html += `<p style="${labelStyle} color:#f87171;">Failed to insert (${summary.failed.length})</p>`;
            html += `<ul style="${listStyle}">${summary.failed.map(r =>
                `<li style="${itemStyle} color:#f87171;"><strong>${escHtml(r.full_name)}</strong> (${escHtml(r.email)}) — ${escHtml(r.reason)}</li>`
            ).join('')}</ul>`;
            html += `</div>`;
        }
    }

    el.innerHTML = html;
    el.hidden = false;
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

/// Look for documents
Object.keys(SECTIONS)
    .filter(id => id !== 'data-migration' && id !== 'documents' && id !== 'meetings')
    .forEach(renderFutureSection);

renderMembersSection();
renderDocumentsSection();

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

    

    // Topbar role badge
    const badge = document.getElementById('roleBadge');
    if (badge) {
        const label = roleLabels[user.role] || 'Member';
        const cssClass = user.role in roleLabels ? user.role : 'member';
        badge.textContent = label;
        badge.classList.add(cssClass);
    }

    // Profile page role pill
    const profileRoleBadge = document.getElementById('profileRoleBadge');
    if (profileRoleBadge) {
        const label = roleLabels[user.role] || 'Member';
        const cssClass = user.role in roleLabels ? user.role : 'member';
        profileRoleBadge.textContent = label;
        profileRoleBadge.classList.add(cssClass);
    }

    // Render all sections
    renderHome(user);

    Object.keys(SECTIONS)
    .filter(id => id !== 'data-migration' && id !== 'documents' && id !== 'e-voting' && id !== 'meetings')
    .forEach(renderFutureSection);

    renderMembersSection();
    renderDocumentsSection();
    renderMeetingsSection();
    renderEvotingSection();

    // Init interactions
    initSidebar();
    initProfile();

    // Show home
    navigate('home');
});
// ============================================================
//  DOCUMENT MANAGEMENT — add this to the bottom of dashboard.js
// ============================================================

let allDocs = [];

async function renderDocumentsSection() {
    const user = getUser();
    const isAdmin = user?.role === 'admin';
    const el = document.getElementById('section-documents');

    el.innerHTML = `
        <div class="section-hdr">
            <div class="section-icon-box"><i class="fas fa-folder-open"></i></div>
            <div>
                <h1 class="section-title-text">5.3 Document Management System</h1>
                <p class="section-scrum-badge">SCRUM-21 · SCRUM-23 · SCRUM-25</p>
            </div>
        </div>

        <div class="members-toolbar">
            <input type="text" id="docSearch" class="member-search-input"
                placeholder="Search by filename or category...">

            <select id="docCategoryFilter" class="member-search-input" style="max-width:200px; cursor:pointer;">
                <option value="">All Categories</option>
                <option value="Uncategorized">Uncategorized</option>
                <option value="Meeting Minutes">Meeting Minutes</option>
                <option value="Financial">Financial</option>
                <option value="Policy">Policy</option>
                <option value="Announcements">Announcements</option>
                <option value="Other">Other</option>
            </select>

            ${isAdmin ? `
            <button class="action-btn" id="uploadDocBtn" >
                <i class="fas fa-upload"></i> Upload Document
            </button>
            <input type="file" id="docFileInput" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" hidden>
            ` : ''}
        </div>

        <div id="docStatus" class="upload-status" hidden></div>

        <div class="members-table-wrapper">
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Document</th>
                        <th>Category</th>
                        <th>Uploaded By</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="docsTableBody">
                    <tr><td colspan="5" class="members-loading">Loading documents...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Upload Modal (admin only) -->
        ${isAdmin ? `
        <div class="modal-overlay" id="uploadDocModal" hidden>
            <div class="modal-card">
                <div class="modal-header">
                    <h3>Upload Document</h3>
                    <button class="modal-close" onclick="closeModal('uploadDocModal')">✕</button>
                </div>
                <div id="uploadDocError" class="upload-status error" hidden></div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Document Title</label>
                        <input type="text" id="docTitle" class="member-search-input"
                            placeholder="e.g. Q1 Meeting Minutes" style="max-width:100%">
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="docCategory" class="member-search-input" style="max-width:100%; cursor:pointer;">
                            <option value="Uncategorized">Uncategorized</option>
                            <option value="Meeting Minutes">Meeting Minutes</option>
                            <option value="Financial">Financial</option>
                            <option value="Policy">Policy</option>
                            <option value="Announcements">Announcements</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>File <span style="color:var(--text-muted);font-size:0.75rem">(PDF, DOCX, XLSX, PNG, JPG — max 20MB)</span></label>
                        <div id="dropZone" style="
                            border: 2px dashed #16263b; border-radius:8px; padding:24px;
                            text-align:center; color:var(--text-secondary); cursor:pointer;
                            transition: border-color 0.2s; font-family:monospace; font-size:0.85rem;
                        ">
                            <i class="fas fa-cloud-upload-alt" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
                            <span id="dropZoneLabel">Click to select or drag & drop a file here</span>
                        </div>
                        <input type="file" id="docFileModalInput" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" hidden>
                    </div>
                    <div class="form-group" id="accessControlGroup">
                        <label>Access</label>
                        <select id="docAccess" class="member-search-input" style="max-width:100%; cursor:pointer;">
                            <option value="members">Members & Admins</option>
                            <option value="admin">Admins Only</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="danger-btn  outline-btn" id="cancelUploadBtn"
                        onclick="closeModal('uploadDocModal')">
                        Cancel
                    </button>
                    <button class="action-btn" id="submitUploadBtn"
                        onclick="submitDocUpload()">
                        <i class="fas fa-upload "></i> Upload
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirm Modal -->
        <div class="modal-overlay" id="deleteDocModal" hidden>
            <div class="modal-card">
                <div class="modal-header">
                    <h3>Delete Document</h3>
                    <button class="modal-close" onclick="closeModal('deleteDocModal')">✕</button>
                </div>
                <div class="modal-body">
                    <p style="color:var(--text-primary);margin-bottom:8px">
                        Are you sure you want to delete <strong id="deleteDocName"></strong>?
                    </p>
                    <p style="color:var(--text-secondary);font-size:0.85rem">This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal('deleteDocModal')"
                        style="background:#0b1523;border:1px solid #16263b;border-radius:8px;padding:10px 16px;color:var(--text-clr);font-family:monospace;font-size:0.9rem;cursor:pointer;">
                        Cancel
                    </button>
                    <button class="danger-btn" id="confirmDeleteDocBtn">Delete</button>
                </div>
            </div>
        </div>
        ` : ''}
    `;

    // Wire up search + filter
    document.getElementById('docSearch').addEventListener('input', filterDocs);
    document.getElementById('docCategoryFilter').addEventListener('change', filterDocs);

    // Admin-only wiring
    if (isAdmin) {
        document.getElementById('uploadDocBtn').addEventListener('click', () => {
            document.getElementById('uploadDocError').hidden = true;
            document.getElementById('docTitle').value = '';
            document.getElementById('docFileModalInput').value = '';
            document.getElementById('dropZoneLabel').textContent = 'Click to select or drag & drop a file here';
            openModal('uploadDocModal');
        });

        // Click on drop zone opens file picker
        document.getElementById('dropZone').addEventListener('click', () => {
            document.getElementById('docFileModalInput').click();
        });

        // Also allow clicking the hidden toolbar file input
        document.getElementById('docFileInput')?.addEventListener('click', () => {
            document.getElementById('uploadDocBtn').click();
        });

        // Show chosen filename in drop zone
        document.getElementById('docFileModalInput').addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('dropZoneLabel').textContent = `Selected: ${file.name}`;
                document.getElementById('dropZone').style.borderColor = '#3b82f6';
            }
        });

        // Drag and drop
        const dropZone = document.getElementById('dropZone');
        dropZone.addEventListener('dragover', e => {
            e.preventDefault();
            dropZone.style.borderColor = '#3b82f6';
            dropZone.style.background = '#3b82f610';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#16263b';
            dropZone.style.background = 'transparent';
        });
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.style.borderColor = '#16263b';
            const file = e.dataTransfer.files[0];
            if (!file) return;

            // Use DataTransfer to properly assign to file input
            const dt = new DataTransfer();
            dt.items.add(file);
            document.getElementById('docFileModalInput').files = dt.files;

            document.getElementById('dropZoneLabel').textContent = `Selected: ${file.name}`;
            dropZone.style.borderColor = '#3b82f6';
        });
    }

    await loadDocuments();
}

async function loadDocuments() {
    const tbody = document.getElementById('docsTableBody');
    try {
        const res = await fetch('/api/documents');
        if (!res.ok) throw new Error();
        const data = await res.json();
        allDocs = data.documents;
        renderDocRows(allDocs);
    } catch {
        tbody.innerHTML = `<tr><td colspan="5" class="members-loading">Could not load documents.</td></tr>`;
    }
}

function renderDocRows(docs) {
    const user = getUser();
    const isAdmin = user?.role === 'admin';
    const tbody = document.getElementById('docsTableBody');

    if (docs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="members-loading">No documents found.</td></tr>`;
        return;
    }

    tbody.innerHTML = docs.map(doc => `
        <tr>
            <td>
                <div class="member-cell">
                    <div class="member-avatar-sm" style="background:#0d2540; border-color:#1e4a7a;">
                        <i class="${getDocIcon(doc.filename)}" style="font-size:0.75rem;"></i>
                    </div>
                    <span>${escHtml(doc.title || doc.filename)}</span>
                </div>
            </td>
            <td><span class="role-pill member">${escHtml(doc.category || 'Uncategorized')}</span></td>
            <td>${escHtml(doc.uploader_name || 'Admin')}</td>
            <td>${new Date(doc.uploaded_at).toLocaleDateString()}</td>
            <td style="display:flex; gap:8px; align-items:center;">
                <a href="DocumentView.html?id=${doc.id}" class="tbl-action-btn" title="View">
                    <i class="fas fa-eye"></i>
                </a>
                <button class="tbl-action-btn" title="Download"
                    onclick="downloadDoc(${doc.id}, '${escHtml(doc.filename)}')">
                    <i class="fas fa-download"></i>
                </button>
                ${isAdmin ? `
                <button class="tbl-action-btn delete" title="Delete"
                    onclick="confirmDeleteDoc(${doc.id}, '${escHtml(doc.title || doc.filename)}')">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </td>
        </tr>
    `).join('');
}

function getDocIcon(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase();
    const icons = {
        pdf: 'fas fa-file-pdf',
        docx: 'fas fa-file-word',
        doc: 'fas fa-file-word',
        xlsx: 'fas fa-file-excel',
        xls: 'fas fa-file-excel',
        png: 'fas fa-file-image',
        jpg: 'fas fa-file-image',
        jpeg: 'fas fa-file-image',
    };
    return icons[ext] || 'fas fa-file';
}

function filterDocs() {
    const query = document.getElementById('docSearch').value.toLowerCase();
    const category = document.getElementById('docCategoryFilter').value;

    const filtered = allDocs.filter(doc => {
        const matchesSearch = !query ||
            (doc.title || doc.filename).toLowerCase().includes(query) ||
            (doc.category || '').toLowerCase().includes(query);
        const matchesCat = !category || doc.category === category;
        return matchesSearch && matchesCat;
    });

    renderDocRows(filtered);
}

async function submitDocUpload() {
    const title = document.getElementById('docTitle').value.trim();
    const category = document.getElementById('docCategory').value;
    const access = document.getElementById('docAccess').value;
    const fileInput = document.getElementById('docFileModalInput');
    const file = fileInput.files[0];
    const errorEl = document.getElementById('uploadDocError');
    const submitBtn = document.getElementById('submitUploadBtn');

    errorEl.hidden = true;

    if (!title) {
        errorEl.textContent = 'Please enter a document title.';
        errorEl.hidden = false;
        return;
    }
    if (!file) {
        errorEl.textContent = 'Please select a file to upload.';
        errorEl.hidden = false;
        return;
    }

    const allowed = ['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
        errorEl.textContent = 'Invalid file type. Allowed: PDF, DOCX, XLSX, PNG, JPG.';
        errorEl.hidden = false;
        return;
    }
    if (file.size > 20 * 1024 * 1024) {
        errorEl.textContent = 'File exceeds 20MB limit.';
        errorEl.hidden = false;
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('access', access);

    try {
        const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (res.ok) {
            closeModal('uploadDocModal');
            showDocStatus(data.message || 'Document uploaded successfully.', 'success');
            await loadDocuments();
        } else {
            errorEl.textContent = data.error || 'Upload failed.';
            errorEl.hidden = false;
        }
    } catch {
        errorEl.textContent = 'Could not connect to server.';
        errorEl.hidden = false;
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload';
}

async function downloadDoc(docId, filename) {
    try {
        const res = await fetch(`/api/documents/download/${docId}`);
        if (res.status === 403) {
            showDocStatus('You do not have permission to download this document.', 'error');
            return;
        }
        if (!res.ok) {
            showDocStatus('File not found or has been removed.', 'error');
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    } catch {
        showDocStatus('Could not connect to server.', 'error');
    }
}

function confirmDeleteDoc(docId, docName) {
    document.getElementById('deleteDocName').textContent = docName;
    document.getElementById('confirmDeleteDocBtn').onclick = () => executeDeleteDoc(docId);
    openModal('deleteDocModal');
}

async function executeDeleteDoc(docId) {
    closeModal('deleteDocModal');
    try {
        const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
        const data = await res.json();
        showDocStatus(data.message || 'Document deleted.', res.ok ? 'success' : 'error');
        if (res.ok) await loadDocuments();
    } catch {
        showDocStatus('Could not connect to server.', 'error');
    }
}

function showDocStatus(message, type) {
    const el = document.getElementById('docStatus');
    el.className = `upload-status ${type}`;
    el.innerHTML = `<p>${escHtml(message)}</p>`;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 4000);
}

// Meeting Management (5.6) → see client/js/meetings.js  |  Styles → client/css/meetings.css

// ============================================================
//  E-VOTING — SCRUM-27/28/31/32
// ============================================================

let allPolls = [];

async function renderEvotingSection() {
    const user = getUser();
    const isAdmin = user?.role === 'admin';
    const el = document.getElementById('section-e-voting');

    el.innerHTML = `
        <div class="section-hdr">
            <div class="section-icon-box"><i class="fas fa-square-poll-vertical"></i></div>
            <div>
                <h1 class="section-title-text">5.4 Electronic Voting System</h1>
                <p class="section-scrum-badge">SCRUM-27 · SCRUM-28 · SCRUM-31 · SCRUM-32</p>
            </div>
        </div>

        <div class="members-toolbar">
            <input type="text" id="pollSearch" class="member-search-input"
                placeholder="Search polls...">
            <select id="pollStatusFilter" class="member-search-input"
                style="max-width:180px; cursor:pointer;">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="closed">Closed</option>
            </select>
            ${isAdmin ? `
            <button class="action-btn" id="createPollBtn">
                <i class="fas fa-plus "></i> Create Poll
            </button>` : ''}
        </div>

        <div id="pollStatus" class="upload-status" hidden></div>

        <div class="members-table-wrapper">
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Poll</th>
                        <th>Status</th>
                        <th>Options</th>
                        <th>Opens</th>
                        <th>Closes</th>
                        <th>Created By</th>
                        ${isAdmin ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody id="pollsTableBody">
                    <tr><td colspan="${isAdmin ? 7 : 6}"
                        class="members-loading">Loading polls...</td></tr>
                </tbody>
            </table>
        </div>

        ${isAdmin ? `
        <!-- Create Poll Modal -->
        <div class="modal-overlay" id="createPollModal" hidden>
            <div class="modal-card" style="max-width:560px;">
                <div class="modal-header">
                    <h3>Create New Poll</h3>
                    <button class="modal-close" onclick="closeModal('createPollModal')">✕</button>
                </div>
                <div id="createPollError" class="upload-status error" hidden></div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Poll Title</label>
                        <input type="text" id="pollTitle" class="member-search-input"
                            placeholder="e.g. Board Election 2026" style="max-width:100%">
                    </div>
                    <div class="form-group">
                        <label>Description <span style="color:var(--secondary-text-clr);
                            font-size:0.75rem">(optional)</span></label>
                        <textarea id="pollDescription" class="member-search-input"
                            placeholder="What is this poll about?"
                            style="max-width:100%; resize:vertical; min-height:70px;
                                padding:10px; font-family:monospace;"></textarea>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div class="form-group">
                            <label>Start Date & Time</label>
                            <input type="datetime-local" id="pollStart"
                                class="member-search-input" style="max-width:100%">
                        </div>
                        <div class="form-group">
                            <label>End Date & Time</label>
                            <input type="datetime-local" id="pollEnd"
                                class="member-search-input" style="max-width:100%">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Access</label>
                        <select id="pollAccess" class="member-search-input"
                            style="max-width:100%; cursor:pointer;">
                            <option value="members">Members & Admins</option>
                            <option value="admin">Admins Only</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Answer Options
                            <span style="color:var(--secondary-text-clr);
                                font-size:0.75rem">(minimum 2)</span>
                        </label>
                        <div id="pollOptionsList">
                            <div class="poll-option-row">
                                <input type="text" class="poll-option-input
                                    member-search-input"
                                    placeholder="Option 1" style="flex:1">
                                <button class="tbl-action-btn delete remove-option-btn"
                                    onclick="removePollOption(this)" disabled>
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="poll-option-row">
                                <input type="text" class="poll-option-input
                                    member-search-input"
                                    placeholder="Option 2" style="flex:1">
                                <button class="tbl-action-btn delete remove-option-btn"
                                    onclick="removePollOption(this)" disabled>
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <button class="action-btn outline-btn" 
                            onclick="addPollOption()"
                            style="margin-top:10px; width:100%; max-width: 400px;background: #0b1523;border: 1px solid #16263b;border-radius: 8px;padding: 10px 16px;color: var(--text-clr);font-family: monospace;font-size: 0.9rem;cursor: pointer;">
                            <i class="fas fa-plus"></i> Add Option
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="danger-btn outline-btn"
                        onclick="closeModal('createPollModal')">Cancel</button>
                    <button class="action-btn" id="createPollSubmitBtn"
                        onclick="submitCreatePoll()">
                        <i class="fas fa-square-poll-vertical"></i> Create Poll
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Poll Modal -->
        <div class="modal-overlay" id="deletePollModal" hidden>
            <div class="modal-card">
                <div class="modal-header">
                    <h3>Delete Poll</h3>
                    <button class="modal-close"
                        onclick="closeModal('deletePollModal')">✕</button>
                </div>
                <div class="modal-body">
                    <p style="color:var(--text-clr);margin-bottom:8px">
                        Are you sure you want to delete
                        <strong id="deletePollName"></strong>?
                    </p>
                    <p style="color:var(--secondary-text-clr);font-size:0.85rem">
                        All votes and options will be permanently removed.
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="action-btn outline-btn"
                        onclick="closeModal('deletePollModal')">Cancel</button>
                    <button class="danger-btn" id="confirmDeletePollBtn">Delete</button>
                </div>
            </div>
        </div>
                <!-- Poll Results Modal -->
<div class="modal-overlay" id="pollResultsModal" hidden>
    <div class="modal-card" style="max-width:560px;">
        <div class="modal-header">
            <h3 id="pollResultsTitle">Poll Results</h3>
            <button class="modal-close"
                onclick="closeModal('pollResultsModal')">✕</button>
        </div>
        <div class="modal-body" id="pollResultsBody"></div>
        <div class="modal-footer">
            <button class="action-btn outline-btn"
                onclick="closeModal('pollResultsModal')">Close</button>
        </div>
    </div>
</div>
        ` : ''}
    `;

    document.getElementById('pollSearch').addEventListener('input', filterPolls);
    document.getElementById('pollStatusFilter').addEventListener('change', filterPolls);

    if (isAdmin) {
        document.getElementById('createPollBtn').addEventListener('click', () => {
            document.getElementById('createPollError').hidden = true;
            document.getElementById('pollTitle').value = '';
            document.getElementById('pollDescription').value = '';
            document.getElementById('pollStart').value = '';
            document.getElementById('pollEnd').value = '';
            document.getElementById('pollAccess').value = 'members';
            // Reset options to two blank rows
            const list = document.getElementById('pollOptionsList');
            list.innerHTML = '';
            addPollOption(); addPollOption();
            openModal('createPollModal');
        });
    }

    await loadPolls();
}

async function loadPolls() {
    const tbody = document.getElementById('pollsTableBody');
    try {
        const res = await fetch('/api/polls');
        if (!res.ok) throw new Error();
        const data = await res.json();
        allPolls = data.polls;
        renderPollRows(allPolls);
    } catch {
        tbody.innerHTML = `<tr><td colspan="7"
            class="members-loading">Could not load polls.</td></tr>`;
    }
}

function renderPollRows(polls) {
    const user = getUser();
    const isAdmin = user?.role === 'admin';
    const tbody = document.getElementById('pollsTableBody');

    if (polls.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}"
            class="members-loading">No polls found.</td></tr>`;
        return;
    }

    const statusClass = { active: 'success', scheduled: 'info', closed: '' };
    const statusLabel = { active: 'Active', scheduled: 'Scheduled', closed: 'Closed' };

    tbody.innerHTML = polls.map(p => {
        const optCount = p.options?.filter(o => o.id).length ?? 0;
        const cls = statusClass[p.status] || '';
        const lbl = statusLabel[p.status] || p.status;

        return `
        <tr>
            <td>
                <div class="member-cell">
                    <div class="member-avatar-sm"
                        style="background:#0d2540;border-color:#1e4a7a;">
                        <i class="fas fa-square-poll-vertical"
                            style="font-size:0.75rem;"></i>
                    </div>
                    <span>${escHtml(p.title)}</span>
                </div>
            </td>
            <td><span class="poll-status-pill ${cls}">${lbl}</span></td>
            <td>${optCount} option${optCount !== 1 ? 's' : ''}</td>
            <td>${new Date(p.start_date).toLocaleDateString()}</td>
            <td>${new Date(p.end_date).toLocaleDateString()}</td>
            <td>${escHtml(p.creator_name || 'Admin')}</td>
            ${isAdmin ? `
            <td>
                <button class="tbl-action-btn result" title="View results"
                    onclick="openPollResults(${p.id})">
                    <i class="fas fa-chart-bar"></i>
                </button>
                <button class="tbl-action-btn delete" title="Delete poll"
                    onclick="confirmDeletePoll(${p.id}, '${escHtml(p.title)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>` : ''}
        </tr>`;
    }).join('');
}

function filterPolls() {
    const q   = document.getElementById('pollSearch').value.toLowerCase();
    const st  = document.getElementById('pollStatusFilter').value;
    renderPollRows(allPolls.filter(p =>
        (!q  || p.title.toLowerCase().includes(q)) &&
        (!st || p.status === st)
    ));
}

function addPollOption() {
    const list = document.getElementById('pollOptionsList');
    const count = list.querySelectorAll('.poll-option-row').length + 1;

    const row = document.createElement('div');
    row.className = 'poll-option-row';
    row.innerHTML = `
        <input type="text" class="poll-option-input member-search-input"
            placeholder="Option ${count}" style="flex:1">
        <button class="tbl-action-btn delete remove-option-btn"
            onclick="removePollOption(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    list.appendChild(row);
    updateRemoveButtons();
}

function removePollOption(btn) {
    const list = document.getElementById('pollOptionsList');
    if (list.querySelectorAll('.poll-option-row').length <= 2) return;
    btn.closest('.poll-option-row').remove();
    updateRemoveButtons();
}

function updateRemoveButtons() {
    const list = document.getElementById('pollOptionsList');
    const rows = list.querySelectorAll('.poll-option-row');
    rows.forEach(row => {
        const btn = row.querySelector('.remove-option-btn');
        btn.disabled = rows.length <= 2;
    });
}

async function submitCreatePoll() {
    const title       = document.getElementById('pollTitle').value.trim();
    const description = document.getElementById('pollDescription').value.trim();
    const start_date  = document.getElementById('pollStart').value;
    const end_date    = document.getElementById('pollEnd').value;
    const access      = document.getElementById('pollAccess').value;
    const errorEl     = document.getElementById('createPollError');
    const submitBtn   = document.getElementById('createPollSubmitBtn');

    const optionInputs = document.querySelectorAll('.poll-option-input');
    const options = Array.from(optionInputs)
        .map(i => i.value.trim())
        .filter(v => v !== '');

    errorEl.hidden = true;

    if (!title) {
        errorEl.textContent = 'Poll title is required.';
        errorEl.hidden = false; return;
    }
    if (!start_date || !end_date) {
        errorEl.textContent = 'Start and end dates are required.';
        errorEl.hidden = false; return;
    }
    if (new Date(end_date) <= new Date(start_date)) {
        errorEl.textContent = 'End date must be after start date.';
        errorEl.hidden = false; return;
    }
    if (options.length < 2) {
        errorEl.textContent = 'Please fill in at least two answer options.';
        errorEl.hidden = false; return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    try {
        const res = await fetch('/api/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, start_date, end_date,
                access, options })
        });
        const data = await res.json();

        if (res.ok) {
            closeModal('createPollModal');
            showPollStatus(data.message, 'success');
            await loadPolls();
        } else {
            errorEl.textContent = data.message;
            errorEl.hidden = false;
        }
    } catch {
        errorEl.textContent = 'Could not connect to server.';
        errorEl.hidden = false;
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML =
        '<i class="fas fa-square-poll-vertical "></i> Create Poll';
}

function confirmDeletePoll(pollId, pollTitle) {
    document.getElementById('deletePollName').textContent = pollTitle;
    document.getElementById('confirmDeletePollBtn').onclick =
        () => executeDeletePoll(pollId);
    openModal('deletePollModal');
}

async function executeDeletePoll(pollId) {
    closeModal('deletePollModal');
    try {
        const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
        const data = await res.json();
        showPollStatus(data.message || 'Poll deleted.', res.ok ? 'success' : 'error');
        if (res.ok) await loadPolls();
    } catch {
        showPollStatus('Could not connect to server.', 'error');
    }
}
function openPollResults(pollId) {
    const poll = allPolls.find(p => p.id === pollId);
    if (!poll) return;

    const options = (poll.options || []).filter(o => o.id);
    const totalVotes = options.reduce((sum, o) => sum + (o.vote_count || 0), 0);

    document.getElementById('pollResultsTitle').textContent = poll.title;

    const isActive = poll.status === 'active';

    document.getElementById('pollResultsBody').innerHTML = `
        <p style="color:var(--secondary-text-clr);font-family:monospace;
            font-size:0.85rem;margin-bottom:20px;">
            ${isActive
                ? '<span style="color:#34d399">● Live</span> — results update on refresh'
                : `Closed · ${new Date(poll.end_date).toLocaleDateString()}`}
            &nbsp;·&nbsp; ${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}
        </p>
        ${options.map(opt => {
            const votes = opt.vote_count || 0;
            const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
            return `
            <div style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;
                    margin-bottom:6px;font-family:monospace;font-size:0.88rem;">
                    <span style="color:var(--text-clr)">${escHtml(opt.option_text)}</span>
                    <span style="color:var(--secondary-text-clr)">${votes} vote${votes !== 1 ? 's' : ''} · ${pct}%</span>
                </div>
                <div style="background:#16263b;border-radius:6px;height:10px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;
                        background:linear-gradient(90deg,#3b82f6,#60a5fa);
                        border-radius:6px;transition:width 0.4s ease;">
                    </div>
                </div>
            </div>`;
        }).join('')}
        ${totalVotes === 0 ? '<p style="color:var(--secondary-text-clr);font-family:monospace;text-align:center;padding:20px 0;">No votes cast yet.</p>' : ''}
    `;

    openModal('pollResultsModal');
}

function showPollStatus(message, type) {
    const el = document.getElementById('pollStatus');
    el.className = `upload-status ${type}`;
    el.innerHTML = `<p>${escHtml(message)}</p>`;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 4000);
}