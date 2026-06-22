// ============================================================
//  5.6 MEETING MANAGEMENT SYSTEM
//  SCRUM-51 (schedule) fully implemented; SCRUM-52–56 laid out
//  Depends on: escHtml() from dashboard.js
// ============================================================

const MEETINGS_STORAGE_KEY = 'org_x_meetings';
let allMeetings = [];

function getMeetingsData() {
    try { return JSON.parse(localStorage.getItem(MEETINGS_STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveMeetingsData(data) {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(data));
}

function meetingComingSoonCard(icon, title, scrum, desc, features) {
    return `
        <div class="coming-card">
            <div class="coming-icon-circle"><i class="${icon}"></i></div>
            <h2 class="coming-title">${title}</h2>
            <p class="section-scrum-badge" style="font-size:13px; margin-bottom:4px;">${scrum}</p>
            <p class="coming-desc">${desc}</p>
            <div class="coming-badge">
                <i class="fas fa-clock"></i>
                Future functionality — will be added as sprints progress
            </div>
            <div class="feature-chips">
                ${features.map(f => `<span class="feature-chip"><i class="fas fa-circle-check"></i>${f}</span>`).join('')}
            </div>
        </div>`;
}

function renderMeetingsSection() {
    const el = document.getElementById('section-meetings');
    if (!el) return;

    el.innerHTML = `
        <div class="section-hdr">
            <div class="section-icon-box"><i class="fas fa-users"></i></div>
            <div>
                <h1 class="section-title-text">5.6 Meeting Management System</h1>
                <p class="section-scrum-badge">SCRUM-51 · SCRUM-52 · SCRUM-53 · SCRUM-54 · SCRUM-55 · SCRUM-56</p>
            </div>
        </div>

        <div class="meetings-tabs">
            <button class="meetings-tab active" data-tab="schedule">
                <i class="fas fa-calendar-plus"></i>
                <span>Schedule</span>
                <small>SCRUM-51</small>
            </button>
            <button class="meetings-tab" data-tab="notifications">
                <i class="fas fa-bell"></i>
                <span>Notifications</span>
                <small>SCRUM-52</small>
            </button>
            <button class="meetings-tab" data-tab="meeting-link">
                <i class="fas fa-link"></i>
                <span>Meeting Link</span>
                <small>SCRUM-53</small>
            </button>
            <button class="meetings-tab" data-tab="minutes">
                <i class="fas fa-file-lines"></i>
                <span>Minutes</span>
                <small>SCRUM-54</small>
            </button>
            <button class="meetings-tab" data-tab="past-meetings">
                <i class="fas fa-clock-rotate-left"></i>
                <span>Past Meetings</span>
                <small>SCRUM-55</small>
            </button>
            <button class="meetings-tab" data-tab="archives">
                <i class="fas fa-box-archive"></i>
                <span>Archives</span>
                <small>SCRUM-56</small>
            </button>
        </div>

        <!-- SCRUM-51: Schedule Meeting (fully implemented) -->
        <div class="meetings-tab-panel active" id="tab-schedule">
            <div class="members-toolbar">
                <input type="text" id="meetingSearch" class="member-search-input"
                    placeholder="Search meetings by title or location...">
                <select id="meetingStatusFilter" class="member-search-input"
                    style="max-width:180px; cursor:pointer;">
                    <option value="">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <button id="scheduleMeetingBtn" class="mtg-btn-primary">
                    <i class="fas fa-calendar-plus"></i> Schedule Meeting
                </button>
            </div>

            <div id="meetingStatus" class="upload-status" hidden></div>

            <div class="members-table-wrapper" style="overflow-x:auto;">
                <table class="members-table" style="min-width:780px;">
                    <thead>
                        <tr>
                            <th style="min-width:200px;">Meeting Title</th>
                            <th style="min-width:130px;">Date / Time</th>
                            <th style="min-width:150px; max-width:200px;">Location</th>
                            <th style="min-width:100px;">Type</th>
                            <th style="min-width:80px;">Duration</th>
                            <th style="min-width:110px;">Status</th>
                            <th style="min-width:270px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="meetingsTableBody">
                        <tr><td colspan="7" class="members-loading">No meetings scheduled yet. Click "Schedule Meeting" to add one.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Schedule / Edit Meeting Modal -->
            <div class="modal-overlay" id="scheduleMeetingModal" hidden>
                <div class="modal-card" style="max-width:540px; width:90vw;">
                    <div class="modal-header">
                        <h3 id="meetingModalTitle">Schedule Meeting</h3>
                        <button class="modal-close" onclick="closeMeetingModal()">✕</button>
                    </div>
                    <div id="meetingModalError" class="upload-status error" hidden></div>
                    <div class="modal-body" style="max-height:55vh; overflow-y:auto; padding-right:4px;">
                        <input type="hidden" id="editMeetingId">
                        <div class="form-group">
                            <label>Meeting Title *</label>
                            <input type="text" id="meetingTitle" class="member-search-input"
                                style="max-width:100%;" placeholder="e.g. Monthly Board Meeting">
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                            <div class="form-group">
                                <label>Date *</label>
                                <input type="date" id="meetingDate" class="member-search-input"
                                    style="max-width:100%; cursor:pointer;">
                            </div>
                            <div class="form-group">
                                <label>Time *</label>
                                <input type="time" id="meetingTime" class="member-search-input"
                                    style="max-width:100%; cursor:pointer;">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                            <div class="form-group">
                                <label>Duration</label>
                                <select id="meetingDuration" class="member-search-input"
                                    style="max-width:100%; cursor:pointer;">
                                    <option value="30 min">30 minutes</option>
                                    <option value="1 hr" selected>1 hour</option>
                                    <option value="1.5 hr">1.5 hours</option>
                                    <option value="2 hr">2 hours</option>
                                    <option value="3 hr">3 hours</option>
                                    <option value="TBD">TBD</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Meeting Type</label>
                                <select id="meetingType" class="member-search-input"
                                    style="max-width:100%; cursor:pointer;">
                                    <option value="in-person">In-Person</option>
                                    <option value="virtual">Virtual</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Location / Link</label>
                            <input type="text" id="meetingLocation" class="member-search-input"
                                style="max-width:100%;"
                                placeholder="e.g. Conference Room A or https://zoom.us/...">
                        </div>
                        <div class="form-group">
                            <label>Agenda</label>
                            <textarea id="meetingAgenda" rows="3" style="
                                width:100%; background:#0b1523; border:1px solid #16263b;
                                border-radius:8px; padding:10px 16px; color:#e6e6ef;
                                font-family:monospace; font-size:0.85rem; resize:vertical;
                                outline:none; box-sizing:border-box;
                            " placeholder="Meeting agenda or additional notes..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="closeMeetingModal()" style="
                            background:#0b1523; border:1px solid #16263b; border-radius:8px;
                            padding:10px 16px; color:#e6e6ef; font-family:monospace;
                            font-size:0.9rem; cursor:pointer;">
                            Cancel
                        </button>
                        <button id="meetingSubmitBtn" onclick="submitMeeting()" style="
                            background:linear-gradient(135deg,#1d4ed8,#3b82f6);
                            border:1px solid #3b82f666; border-radius:8px; padding:10px 20px;
                            color:#fff; font-family:monospace; font-size:0.9rem; font-weight:600;
                            cursor:pointer; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-calendar-check"></i>
                            <span id="meetingSubmitLabel">Schedule</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Confirm Cancel Meeting Modal -->
            <div class="modal-overlay" id="cancelMeetingModal" hidden>
                <div class="modal-card">
                    <div class="modal-header">
                        <h3>Cancel Meeting</h3>
                        <button class="modal-close"
                            onclick="document.getElementById('cancelMeetingModal').hidden=true">✕</button>
                    </div>
                    <div class="modal-body">
                        <p style="color:#e6e6ef; margin-bottom:8px;">
                            Are you sure you want to cancel <strong id="cancelMeetingName"></strong>?
                        </p>
                        <p style="color:#94a3b8; font-size:0.85rem;">
                            The meeting will be marked as cancelled.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button onclick="document.getElementById('cancelMeetingModal').hidden=true" style="
                            background:#0b1523; border:1px solid #16263b; border-radius:8px;
                            padding:10px 16px; color:#e6e6ef; font-family:monospace;
                            font-size:0.9rem; cursor:pointer;">
                            Keep Meeting
                        </button>
                        <button class="danger-btn" id="confirmCancelMeetingBtn">Cancel Meeting</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- SCRUM-52: Meeting Notifications -->
        <div class="meetings-tab-panel" id="tab-notifications">
            ${meetingComingSoonCard(
                'fas fa-bell',
                'Meeting Notifications',
                'SCRUM-52',
                'Automated system that alerts all members when a meeting is scheduled, rescheduled, or cancelled. Members stay informed without any manual follow-up.',
                ['Email Alerts', 'Push Notifications', 'Reminder Scheduling', 'Cancellation Notices']
            )}
        </div>

        <!-- SCRUM-53: Meeting Link -->
        <div class="meetings-tab-panel" id="tab-meeting-link">
            ${meetingComingSoonCard(
                'fas fa-link',
                'Meeting Links',
                'SCRUM-53',
                'Attach virtual meeting links to any scheduled meeting. Supports Zoom, Microsoft Teams, Google Meet, and other platforms for seamless remote participation.',
                ['Zoom Integration', 'Teams Support', 'Google Meet', 'One-Click Join']
            )}
        </div>

        <!-- SCRUM-54: Meeting Minutes -->
        <div class="meetings-tab-panel" id="tab-minutes">
            ${meetingComingSoonCard(
                'fas fa-file-lines',
                'Meeting Minutes',
                'SCRUM-54',
                'Record and publish official meeting minutes during or after each session. Decisions, action items, and outcomes are documented for full organizational transparency.',
                ['Live Minute Recording', 'Decision Log', 'Action Items Tracker', 'Minutes Distribution']
            )}
        </div>

        <!-- SCRUM-55: Past Meetings -->
        <div class="meetings-tab-panel" id="tab-past-meetings">
            ${meetingComingSoonCard(
                'fas fa-clock-rotate-left',
                'Past Meetings',
                'SCRUM-55',
                'Members can browse and review records of all past meetings, access published minutes, and view attendance history for full organizational transparency.',
                ['Meeting History', 'Search & Filter', 'Minutes Access', 'Attendance Records']
            )}
        </div>

        <!-- SCRUM-56: Meeting Archives -->
        <div class="meetings-tab-panel" id="tab-archives">
            ${meetingComingSoonCard(
                'fas fa-box-archive',
                'Meeting Archives',
                'SCRUM-56',
                'Automatic archiving of completed meetings for long-term record keeping, compliance, and institutional memory. Archives are searchable and permanently retained.',
                ['Auto-Archiving', 'Retention Policies', 'Archive Search', 'Compliance Audit Trail']
            )}
        </div>
    `;

    // Internal tab switching
    el.querySelectorAll('.meetings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            el.querySelectorAll('.meetings-tab').forEach(t => t.classList.remove('active'));
            el.querySelectorAll('.meetings-tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = el.querySelector(`#tab-${tab.dataset.tab}`);
            if (panel) panel.classList.add('active');
        });
    });

    document.getElementById('scheduleMeetingBtn').addEventListener('click', () => openScheduleMeetingModal());
    document.getElementById('meetingSearch').addEventListener('input', filterMeetings);
    document.getElementById('meetingStatusFilter').addEventListener('change', filterMeetings);

    allMeetings = getMeetingsData();
    renderMeetingRows(allMeetings);
}

function openScheduleMeetingModal(meetingId = null) {
    const errorEl = document.getElementById('meetingModalError');
    errorEl.hidden = true;

    if (meetingId) {
        const m = allMeetings.find(x => x.id === meetingId);
        if (!m) return;
        document.getElementById('meetingModalTitle').textContent = 'Reschedule Meeting';
        document.getElementById('meetingSubmitLabel').textContent = 'Save Changes';
        document.getElementById('editMeetingId').value = meetingId;
        document.getElementById('meetingTitle').value = m.title;
        document.getElementById('meetingDate').value = m.date;
        document.getElementById('meetingTime').value = m.time;
        document.getElementById('meetingDuration').value = m.duration;
        document.getElementById('meetingType').value = m.type;
        document.getElementById('meetingLocation').value = m.location || '';
        document.getElementById('meetingAgenda').value = m.agenda || '';
    } else {
        document.getElementById('meetingModalTitle').textContent = 'Schedule Meeting';
        document.getElementById('meetingSubmitLabel').textContent = 'Schedule';
        document.getElementById('editMeetingId').value = '';
        document.getElementById('meetingTitle').value = '';
        document.getElementById('meetingDate').value = '';
        document.getElementById('meetingTime').value = '';
        document.getElementById('meetingDuration').value = '1 hr';
        document.getElementById('meetingType').value = 'in-person';
        document.getElementById('meetingLocation').value = '';
        document.getElementById('meetingAgenda').value = '';
    }

    document.getElementById('scheduleMeetingModal').hidden = false;
}

function closeMeetingModal() {
    document.getElementById('scheduleMeetingModal').hidden = true;
}

function submitMeeting() {
    const title    = document.getElementById('meetingTitle').value.trim();
    const date     = document.getElementById('meetingDate').value;
    const time     = document.getElementById('meetingTime').value;
    const duration = document.getElementById('meetingDuration').value;
    const type     = document.getElementById('meetingType').value;
    const location = document.getElementById('meetingLocation').value.trim();
    const agenda   = document.getElementById('meetingAgenda').value.trim();
    const editId   = document.getElementById('editMeetingId').value;
    const errorEl  = document.getElementById('meetingModalError');

    errorEl.hidden = true;

    if (!title) { errorEl.textContent = 'Meeting title is required.'; errorEl.hidden = false; return; }
    if (!date)  { errorEl.textContent = 'Date is required.';          errorEl.hidden = false; return; }
    if (!time)  { errorEl.textContent = 'Time is required.';          errorEl.hidden = false; return; }

    const meetings = getMeetingsData();

    if (editId) {
        const idx = meetings.findIndex(m => m.id === editId);
        if (idx !== -1) {
            meetings[idx] = { ...meetings[idx], title, date, time, duration, type, location, agenda };
        }
        saveMeetingsData(meetings);
        allMeetings = meetings;
        closeMeetingModal();
        filterMeetings();
        showMeetingStatus('Meeting rescheduled successfully.', 'success');
    } else {
        meetings.push({
            id: 'mtg_' + Date.now(),
            title, date, time, duration, type, location, agenda,
            status: 'scheduled',
            created_at: new Date().toISOString()
        });
        saveMeetingsData(meetings);
        allMeetings = meetings;
        closeMeetingModal();
        filterMeetings();
        showMeetingStatus('Meeting scheduled successfully.', 'success');
    }
}

function renderMeetingRows(meetings) {
    const tbody = document.getElementById('meetingsTableBody');
    if (!tbody) return;

    if (!meetings || meetings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="members-loading">No meetings found. Click "Schedule Meeting" to add one.</td></tr>`;
        return;
    }

    const typeLabels = { 'in-person': 'In-Person', virtual: 'Virtual', hybrid: 'Hybrid' };
    const typeStyle  = {
        'in-person': 'background:#7c3aed1a; color:#a78bfa; border:1px solid #7c3aed33;',
        virtual:     'background:#0891b21a; color:#67e8f9; border:1px solid #0891b233;',
        hybrid:      'background:#d977061a; color:#fcd34d; border:1px solid #d9770633;'
    };
    const statusStyle = {
        scheduled: 'background:#3b82f61a; color:#60a5fa; border:1px solid #3b82f633;',
        completed: 'background:#10b9811a; color:#34d399; border:1px solid #10b98133;',
        cancelled: 'background:#ef44441a; color:#f87171; border:1px solid #ef444433;'
    };
    const statusIcon = {
        scheduled: 'fas fa-calendar-check',
        completed: 'fas fa-circle-check',
        cancelled: 'fas fa-ban'
    };

    tbody.innerHTML = meetings.map(m => {
        const d = new Date(`${m.date}T${m.time}`);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const cancelled = m.status === 'cancelled';
        const safeTitle = m.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        return `<tr>
            <td>
                <div class="member-cell">
                    <div class="member-avatar-sm" style="background:#0d2045;border-color:#3b3f82;color:#a78bfa;">
                        <i class="fas fa-users" style="font-size:0.6rem;"></i>
                    </div>
                    <div>
                        <span style="display:block;font-weight:600;color:#e6e6ef;">${escHtml(m.title)}</span>
                        ${m.agenda ? `<span style="font-size:0.75rem;color:#94a3b8;display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(m.agenda)}</span>` : ''}
                    </div>
                </div>
            </td>
            <td>
                <span style="display:block;color:#e6e6ef;">${dateStr}</span>
                <span style="font-size:0.8rem;color:#94a3b8;">${timeStr}</span>
            </td>
            <td style="max-width:200px;">
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${m.location ? '#e6e6ef' : '#475569'};" title="${m.location ? escHtml(m.location) : ''}">
                    ${m.location ? escHtml(m.location) : '—'}
                </div>
            </td>
            <td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-family:monospace;${typeStyle[m.type] || ''}">${typeLabels[m.type] || m.type}</span></td>
            <td style="color:#94a3b8;font-family:monospace;font-size:0.82rem;white-space:nowrap;">${escHtml(m.duration)}</td>
            <td><span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:12px;font-size:0.72rem;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;${statusStyle[m.status] || ''}"><i class="${statusIcon[m.status] || 'fas fa-circle'}" style="font-size:9px;"></i>${m.status}</span></td>
            <td>
                ${m.status === 'scheduled' ? `
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="mtg-act-btn reschedule-btn" onclick="openScheduleMeetingModal('${m.id}')">
                        <i class="fas fa-calendar-days"></i> Reschedule
                    </button>
                    <button class="mtg-act-btn complete-btn" onclick="executeCompleteMeeting('${m.id}')">
                        <i class="fas fa-circle-check"></i> Complete
                    </button>
                    <button class="mtg-act-btn cancel-btn" onclick="confirmCancelMeeting('${m.id}','${safeTitle}')">
                        <i class="fas fa-ban"></i> Cancel
                    </button>
                </div>`
                : m.status === 'completed'
                ? `<span style="color:#34d399;font-size:0.75rem;font-family:monospace;display:inline-flex;align-items:center;gap:5px;"><i class="fas fa-circle-check"></i> Completed</span>`
                : `<span style="color:#475569;font-size:0.75rem;font-family:monospace;display:inline-flex;align-items:center;gap:5px;"><i class="fas fa-ban"></i> Cancelled</span>`}
            </td>
        </tr>`;
    }).join('');
}

function filterMeetings() {
    const query  = (document.getElementById('meetingSearch')?.value || '').toLowerCase();
    const status = document.getElementById('meetingStatusFilter')?.value || '';
    renderMeetingRows(allMeetings.filter(m =>
        (!query  || m.title.toLowerCase().includes(query) || (m.location || '').toLowerCase().includes(query)) &&
        (!status || m.status === status)
    ));
}

function confirmCancelMeeting(id, name) {
    document.getElementById('cancelMeetingName').textContent = name;
    document.getElementById('confirmCancelMeetingBtn').onclick = () => executeCancelMeeting(id);
    document.getElementById('cancelMeetingModal').hidden = false;
}

function executeCancelMeeting(id) {
    document.getElementById('cancelMeetingModal').hidden = true;
    const meetings = getMeetingsData();
    const idx = meetings.findIndex(m => m.id === id);
    if (idx !== -1) {
        meetings[idx].status = 'cancelled';
        saveMeetingsData(meetings);
        allMeetings = meetings;
        filterMeetings();
        showMeetingStatus('Meeting has been cancelled.', 'info');
    }
}

function executeCompleteMeeting(id) {
    const meetings = getMeetingsData();
    const idx = meetings.findIndex(m => m.id === id);
    if (idx !== -1) {
        meetings[idx].status = 'completed';
        saveMeetingsData(meetings);
        allMeetings = meetings;
        filterMeetings();
        showMeetingStatus('Meeting marked as completed.', 'success');
    }
}

function showMeetingStatus(message, type) {
    const el = document.getElementById('meetingStatus');
    if (!el) return;
    el.className = `upload-status ${type}`;
    el.innerHTML = `<p>${escHtml(message)}</p>`;
    el.hidden = false;
    setTimeout(() => { if (el) el.hidden = true; }, 4000);
}
