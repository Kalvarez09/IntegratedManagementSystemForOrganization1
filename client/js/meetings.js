// ============================================================
//  5.6 MEETING MANAGEMENT SYSTEM
//  SCRUM-51 (schedule) fully implemented; SCRUM-52–56 laid out
//  Depends on: escHtml() from dashboard.js
// ============================================================

const MEETINGS_STORAGE_KEY = 'org_x_meetings';
let allMeetings = [];
let meetingsIsAdmin = false;
const MEETING_ADMIN_ROLES = ['admin', 'president', 'vice_president', 'secretary', 'treasurer', 'technical_lead'];

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

    const _u = JSON.parse(localStorage.getItem('user') || '{}');
    meetingsIsAdmin = MEETING_ADMIN_ROLES.includes(_u.role);

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
                ${meetingsIsAdmin ? `<button id="scheduleMeetingBtn" class="mtg-btn-primary">
                    <i class="fas fa-calendar-plus"></i> Schedule Meeting
                </button>` : ''}
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
            <div style="margin-bottom:20px;">
                <h2 style="color:#e6e6ef;font-size:1.1rem;font-family:monospace;font-weight:700;margin:0 0 4px;">
                    <i class="fas fa-bell" style="color:#60a5fa;margin-right:8px;"></i>Meeting Notifications
                </h2>
                <p style="color:#94a3b8;font-size:0.82rem;font-family:monospace;margin:0;">
                    SCRUM-52 &middot; Email alerts are sent automatically when meetings are scheduled, updated, or cancelled.
                </p>
            </div>

            <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#10b9811a;border:1px solid #10b98133;border-radius:8px;margin-bottom:24px;font-family:monospace;font-size:0.82rem;color:#34d399;">
                <i class="fas fa-circle-check"></i> Email notifications active &middot; SMTP configured
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:24px;">
                <div style="background:#0b1523;border:1px solid #1d4ed833;border-radius:10px;padding:18px;">
                    <div style="width:36px;height:36px;background:#1d4ed81a;border:1px solid #1d4ed833;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                        <i class="fas fa-calendar-plus" style="color:#60a5fa;font-size:0.85rem;"></i>
                    </div>
                    <div style="font-size:0.85rem;font-weight:600;color:#e6e6ef;font-family:monospace;margin-bottom:6px;">Meeting Scheduled</div>
                    <div style="font-size:0.77rem;color:#94a3b8;font-family:monospace;line-height:1.5;">Email sent to all active members with the title, date/time, and location.</div>
                </div>
                <div style="background:#0b1523;border:1px solid #d9770633;border-radius:10px;padding:18px;">
                    <div style="width:36px;height:36px;background:#d977061a;border:1px solid #d9770633;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                        <i class="fas fa-calendar-days" style="color:#fcd34d;font-size:0.85rem;"></i>
                    </div>
                    <div style="font-size:0.85rem;font-weight:600;color:#e6e6ef;font-family:monospace;margin-bottom:6px;">Meeting Rescheduled</div>
                    <div style="font-size:0.77rem;color:#94a3b8;font-family:monospace;line-height:1.5;">Follow-up email indicating the change and showing the updated date, time &amp; location.</div>
                </div>
                <div style="background:#0b1523;border:1px solid #ef444433;border-radius:10px;padding:18px;">
                    <div style="width:36px;height:36px;background:#ef44441a;border:1px solid #ef444433;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                        <i class="fas fa-ban" style="color:#f87171;font-size:0.85rem;"></i>
                    </div>
                    <div style="font-size:0.85rem;font-weight:600;color:#e6e6ef;font-family:monospace;margin-bottom:6px;">Meeting Cancelled</div>
                    <div style="font-size:0.77rem;color:#94a3b8;font-family:monospace;line-height:1.5;">Cancellation email sent to all members who were originally notified.</div>
                </div>
            </div>

            <div style="background:#0b1523;border:1px solid #16263b;border-radius:10px;padding:18px;">
                <div style="font-size:0.7rem;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #16263b;">Reliability Guarantees</div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    <div style="display:flex;align-items:flex-start;gap:10px;">
                        <i class="fas fa-shield-halved" style="color:#60a5fa;margin-top:2px;font-size:0.8rem;flex-shrink:0;"></i>
                        <span style="font-size:0.8rem;color:#94a3b8;font-family:monospace;line-height:1.5;">If an email fails for a specific member, the failure is logged and sending continues to remaining members — one bad address does not block the rest.</span>
                    </div>
                    <div style="display:flex;align-items:flex-start;gap:10px;">
                        <i class="fas fa-server" style="color:#a78bfa;margin-top:2px;font-size:0.8rem;flex-shrink:0;"></i>
                        <span style="font-size:0.8rem;color:#94a3b8;font-family:monospace;line-height:1.5;">If the SMTP server is unavailable, the meeting is still saved successfully and a warning is displayed to the admin.</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- SCRUM-53: Meeting Link -->
        <div class="meetings-tab-panel" id="tab-meeting-link">
            <div style="margin-bottom:20px;">
                <h2 style="color:#e6e6ef;font-size:1.1rem;font-family:monospace;font-weight:700;margin:0 0 4px;">
                    <i class="fas fa-link" style="color:#60a5fa;margin-right:8px;"></i>Meeting Links
                </h2>
                <p style="color:#94a3b8;font-size:0.82rem;font-family:monospace;margin:0;">
                    SCRUM-53 &middot; Attach virtual join links to scheduled meetings. Members can join directly from here.
                </p>
            </div>

            <div id="meetingLinksContent">
                <p style="color:#94a3b8;font-family:monospace;padding:20px 0;text-align:center;">Loading...</p>
            </div>

            <!-- Add / Edit Link Modal -->
            <div class="modal-overlay" id="meetingLinkModal" hidden>
                <div class="modal-card" style="max-width:480px;width:90vw;">
                    <div class="modal-header">
                        <div>
                            <h3 id="linkModalTitle">Add Meeting Link</h3>
                            <p id="linkModalMeetingName" style="font-size:0.78rem;color:#94a3b8;margin:3px 0 0;font-family:monospace;"></p>
                        </div>
                        <button class="modal-close" onclick="document.getElementById('meetingLinkModal').hidden=true">&#x2715;</button>
                    </div>
                    <div id="linkModalError" class="upload-status error" hidden></div>
                    <input type="hidden" id="linkModalMeetingId">
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Meeting Link / Location</label>
                            <input type="text" id="linkModalUrl" class="member-search-input" style="max-width:100%;"
                                placeholder="https://zoom.us/j/... or Conference Room A">
                        </div>
                        <p style="color:#64748b;font-size:0.75rem;font-family:monospace;margin:8px 0 0;line-height:1.5;">
                            Paste a Zoom, Microsoft Teams, or Google Meet URL for virtual meetings, or enter a room name for in-person.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button onclick="document.getElementById('meetingLinkModal').hidden=true" style="
                            background:#0b1523;border:1px solid #16263b;border-radius:8px;
                            padding:10px 16px;color:#e6e6ef;font-family:monospace;font-size:0.9rem;cursor:pointer;">
                            Cancel
                        </button>
                        <button onclick="saveMeetingLink()" style="
                            background:linear-gradient(135deg,#1d4ed8,#3b82f6);border:1px solid #3b82f666;
                            border-radius:8px;padding:10px 20px;color:#fff;font-family:monospace;
                            font-size:0.9rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;">
                            <i class="fas fa-link"></i> Save Link
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- SCRUM-54: Meeting Minutes (fully implemented) -->
        <div class="meetings-tab-panel" id="tab-minutes">
            <div style="margin-bottom:20px;">
                <h2 style="color:#e6e6ef;font-size:1.1rem;font-family:monospace;font-weight:700;margin:0 0 4px;">
                    <i class="fas fa-file-lines" style="color:#60a5fa;margin-right:8px;"></i>Meeting Minutes
                </h2>
                <p style="color:#94a3b8;font-size:0.82rem;font-family:monospace;margin:0;">
                    SCRUM-54 · Record and publish official minutes for each meeting.
                </p>
            </div>

            <div id="minutesTabContent">
                <p style="color:#94a3b8;font-family:monospace;padding:20px 0;text-align:center;">Loading...</p>
            </div>

            <!-- Record Minutes Modal -->
            <div class="modal-overlay" id="minutesModal" hidden>
                <div class="modal-card" style="max-width:620px;width:90vw;">
                    <div class="modal-header">
                        <div>
                            <h3 id="minutesModalMeeting">Record Minutes</h3>
                            <p id="minutesModalMeta" style="font-size:0.78rem;color:#94a3b8;margin:3px 0 0;font-family:monospace;"></p>
                        </div>
                        <button class="modal-close" onclick="document.getElementById('minutesModal').hidden=true">✕</button>
                    </div>
                    <div id="minutesModalError" class="upload-status error" hidden></div>
                    <input type="hidden" id="minutesMeetingId">
                    <div class="modal-body" style="padding-top:4px;">
                        <div class="form-group">
                            <label>Minutes *</label>
                            <textarea id="minutesText" rows="12" style="
                                width:100%; background:#0b1523; border:1px solid #16263b;
                                border-radius:8px; padding:12px 16px; color:#e6e6ef;
                                font-family:monospace; font-size:0.85rem; resize:vertical;
                                outline:none; box-sizing:border-box; line-height:1.6;
                            " placeholder="Record decisions, action items, and key discussions from this meeting..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="document.getElementById('minutesModal').hidden=true" style="
                            background:#0b1523;border:1px solid #16263b;border-radius:8px;
                            padding:10px 16px;color:#e6e6ef;font-family:monospace;
                            font-size:0.9rem;cursor:pointer;">
                            Cancel
                        </button>
                        <button onclick="saveMinutes()" style="
                            background:linear-gradient(135deg,#065f46,#10b981);
                            border:1px solid #10b98155;border-radius:8px;padding:10px 20px;
                            color:#fff;font-family:monospace;font-size:0.9rem;font-weight:600;
                            cursor:pointer;display:flex;align-items:center;gap:8px;">
                            <i class="fas fa-floppy-disk"></i> Save Minutes
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- SCRUM-55: Past Meetings -->
        <div class="meetings-tab-panel" id="tab-past-meetings">
            <div style="margin-bottom:20px;">
                <h2 style="color:#e6e6ef;font-size:1.1rem;font-family:monospace;font-weight:700;margin:0 0 4px;">
                    <i class="fas fa-clock-rotate-left" style="color:#a78bfa;margin-right:8px;"></i>Past Meetings
                </h2>
                <p style="color:#94a3b8;font-size:0.82rem;font-family:monospace;margin:0;">
                    SCRUM-55 · All meetings whose date has already passed. Click a row to view details &amp; minutes.
                </p>
            </div>
            <div id="adminPastMeetingsList"></div>

            <!-- Admin Past Meeting Detail Modal -->
            <div class="modal-overlay" id="adminPastMeetingModal" hidden>
                <div class="modal-card" style="max-width:660px;width:92vw;">
                    <div class="modal-header">
                        <div style="flex:1;min-width:0;">
                            <h3 id="apmTitle" style="margin:0;word-break:break-word;"></h3>
                            <p id="apmBadges" style="margin:6px 0 0;display:flex;gap:6px;flex-wrap:wrap;"></p>
                        </div>
                        <button class="modal-close" id="apmCloseX">✕</button>
                    </div>
                    <div class="modal-body" style="display:flex;flex-direction:column;gap:20px;">
                        <div id="apmDetails" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"></div>
                        <div>
                            <div style="font-size:0.7rem;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #16263b;">Meeting Minutes</div>
                            <div id="apmMinutes"></div>
                        </div>
                    </div>
                    <div class="modal-footer" id="apmFooter"></div>
                </div>
            </div>
        </div>

        <!-- SCRUM-56: Meeting Archives -->
        <div class="meetings-tab-panel" id="tab-archives">
            <div style="margin-bottom:20px;">
                <h2 style="color:#e6e6ef;font-size:1.1rem;font-family:monospace;font-weight:700;margin:0 0 4px;">
                    <i class="fas fa-box-archive" style="color:#fcd34d;margin-right:8px;"></i>Meeting Archives
                </h2>
                <p style="color:#94a3b8;font-size:0.82rem;font-family:monospace;margin:0;">
                    SCRUM-56 · Meetings are automatically archived 12 months after their date. All data is preserved. Click a row to view full details.
                </p>
            </div>
            <div id="adminArchivesList"></div>

            <!-- Archive Detail Modal -->
            <div class="modal-overlay" id="adminArchiveModal" hidden>
                <div class="modal-card" style="max-width:660px;width:92vw;">
                    <div class="modal-header">
                        <div style="flex:1;min-width:0;">
                            <h3 id="archTitle" style="margin:0;word-break:break-word;"></h3>
                            <p id="archBadges" style="margin:6px 0 0;display:flex;gap:6px;flex-wrap:wrap;"></p>
                        </div>
                        <button class="modal-close" id="archCloseX">✕</button>
                    </div>
                    <div class="modal-body" style="display:flex;flex-direction:column;gap:20px;">
                        <div id="archDetails" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"></div>
                        <div>
                            <div style="font-size:0.7rem;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #16263b;">Meeting Minutes</div>
                            <div id="archMinutes"></div>
                        </div>
                    </div>
                    <div class="modal-footer" id="archFooter"></div>
                </div>
            </div>
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
            if (tab.dataset.tab === 'minutes') refreshMinutesTab();
            if (tab.dataset.tab === 'past-meetings') renderPastMeetingsTab();
            if (tab.dataset.tab === 'archives') renderArchivesTab();
            if (tab.dataset.tab === 'meeting-link') renderMeetingLinksTab();
        });
    });

    // Past Meetings tab — card clicks & modal close
    document.getElementById('tab-past-meetings').addEventListener('click', function(e) {
        const card = e.target.closest('.admin-past-card');
        if (card) openAdminPastMeetingModal(card.dataset.apmId);
    });
    document.getElementById('apmCloseX').addEventListener('click', () => {
        document.getElementById('adminPastMeetingModal').hidden = true;
    });
    document.getElementById('adminPastMeetingModal').addEventListener('click', function(e) {
        if (e.target === this) this.hidden = true;
    });

    // Archives tab — card clicks & modal close
    document.getElementById('tab-archives').addEventListener('click', function(e) {
        const card = e.target.closest('.admin-archive-card');
        if (card) openAdminArchiveModal(card.dataset.archId);
    });
    document.getElementById('archCloseX').addEventListener('click', () => {
        document.getElementById('adminArchiveModal').hidden = true;
    });
    document.getElementById('adminArchiveModal').addEventListener('click', function(e) {
        if (e.target === this) this.hidden = true;
    });

    if (meetingsIsAdmin) {
        document.getElementById('scheduleMeetingBtn').addEventListener('click', () => openScheduleMeetingModal());
    }
    document.getElementById('meetingSearch').addEventListener('input', filterMeetings);
    document.getElementById('meetingStatusFilter').addEventListener('change', filterMeetings);
    document.getElementById('meetingLinkModal').addEventListener('click', function(e) {
        if (e.target === this) this.hidden = true;
    });

    autoArchiveMeetings();
    allMeetings = getMeetingsData();
    filterMeetings();
    refreshMinutesTab();
    loadMeetingsFromApi();
}

function openScheduleMeetingModal(meetingId = null) {
    const errorEl = document.getElementById('meetingModalError');
    errorEl.hidden = true;

    if (meetingId) {
        const m = allMeetings.find(x => String(x.id) === String(meetingId));
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

    const _sb = document.getElementById('meetingSubmitBtn');
    if (_sb) _sb.dataset.pastWarned = '';
    document.getElementById('scheduleMeetingModal').hidden = false;
}

function closeMeetingModal() {
    document.getElementById('scheduleMeetingModal').hidden = true;
}

async function submitMeeting() {
    const title     = document.getElementById('meetingTitle').value.trim();
    const date      = document.getElementById('meetingDate').value;
    const time      = document.getElementById('meetingTime').value;
    const duration  = document.getElementById('meetingDuration').value;
    const type      = document.getElementById('meetingType').value;
    const location  = document.getElementById('meetingLocation').value.trim();
    const agenda    = document.getElementById('meetingAgenda').value.trim();
    const editId    = document.getElementById('editMeetingId').value;
    const errorEl   = document.getElementById('meetingModalError');
    const submitBtn = document.getElementById('meetingSubmitBtn');
    const labelEl   = document.getElementById('meetingSubmitLabel');

    errorEl.hidden = true;
    errorEl.className = 'upload-status error';

    if (!title) { errorEl.textContent = 'Meeting title is required.'; errorEl.hidden = false; return; }
    if (!date)  { errorEl.textContent = 'Date is required.';          errorEl.hidden = false; return; }
    if (!time)  { errorEl.textContent = 'Time is required.';          errorEl.hidden = false; return; }

    // Warn on past date — require a second click to proceed
    if (new Date(`${date}T${time}`) < new Date() && submitBtn.dataset.pastWarned !== 'true') {
        submitBtn.dataset.pastWarned = 'true';
        errorEl.className = 'upload-status info';
        errorEl.textContent = 'Warning: this date is in the past. Click again to save as a historical record.';
        errorEl.hidden = false;
        return;
    }

    const meetingData = { title, date, time, duration, type, location, agenda };

    submitBtn.disabled = true;
    const origLabel = labelEl.textContent;
    labelEl.textContent = 'Saving...';

    try {
        if (editId) {
            // Reschedule: update DB if DB-backed, always update localStorage
            const dbId = Number(editId);
            if (!isNaN(dbId) && dbId > 0) {
                const resp = await fetch(`/api/meetings/${dbId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(meetingData)
                });
                if (!resp.ok) {
                    const d = await resp.json().catch(() => ({}));
                    errorEl.className = 'upload-status error';
                    errorEl.textContent = d.message || 'Failed to update meeting.';
                    errorEl.hidden = false;
                    return;
                }
            }
            const meetings = getMeetingsData();
            const idx = meetings.findIndex(m => String(m.id) === String(editId));
            if (idx !== -1) meetings[idx] = { ...meetings[idx], ...meetingData };
            saveMeetingsData(meetings);
            allMeetings = meetings;
            closeMeetingModal();
            filterMeetings();
            sendMeetingNotification('update', meetingData);
        } else {
            // Create: POST to DB
            const resp = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(meetingData)
            });
            const d = await resp.json();
            if (!resp.ok) {
                errorEl.className = 'upload-status error';
                errorEl.textContent = d.message || 'Failed to create meeting.';
                errorEl.hidden = false;
                return;
            }
            const m = d.meeting;
            const newMeeting = {
                id: m.id,
                title: m.title,
                date: m.date,
                time: m.time,
                duration: m.duration || '1 hr',
                type: m.type || 'in-person',
                location: m.location || '',
                agenda: m.agenda || '',
                status: 'scheduled',
                minutes: '',
                created_at: m.created_at
            };
            const meetings = getMeetingsData();
            meetings.push(newMeeting);
            saveMeetingsData(meetings);
            allMeetings = meetings;
            closeMeetingModal();
            filterMeetings();
            sendMeetingNotification('create', meetingData);
        }
    } catch (err) {
        console.error('[Meetings] submitMeeting error:', err);
        errorEl.className = 'upload-status error';
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.hidden = false;
    } finally {
        submitBtn.disabled = false;
        labelEl.textContent = origLabel;
    }
}

async function sendMeetingNotification(action, meeting) {
    const label = action === 'create' ? 'scheduled' : 'rescheduled';
    showMeetingStatus(`Meeting ${label}. Sending email notifications...`, 'success', 8000);
    try {
        const resp = await fetch(`/api/meetings/notify/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meeting)
        });
        const data = await resp.json();
        if (resp.status === 503 || data.smtpUnavailable) {
            showMeetingStatus(`Meeting ${label} successfully. Warning: email notifications could not be sent — SMTP server unavailable.`, 'info', 8000);
        } else if (data.success) {
            const failNote = data.failed > 0 ? ` (${data.failed} failed — check server logs)` : '';
            showMeetingStatus(`Meeting ${label} successfully. Notifications sent to ${data.sent} member${data.sent !== 1 ? 's' : ''}${failNote}.`, 'success', 8000);
        } else {
            showMeetingStatus(`Meeting ${label} successfully. Could not send notifications.`, 'info', 8000);
        }
    } catch {
        showMeetingStatus(`Meeting ${label} successfully. Notifications not sent — server unreachable.`, 'info', 8000);
    }
}

async function sendCancelNotification(meeting) {
    showMeetingStatus('Meeting cancelled. Sending cancellation notifications...', 'info', 8000);
    try {
        const resp = await fetch('/api/meetings/notify/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: meeting.title, date: meeting.date, time: meeting.time, location: meeting.location })
        });
        const data = await resp.json();
        if (resp.status === 503 || data.smtpUnavailable) {
            showMeetingStatus('Meeting cancelled. Warning: notifications could not be sent — SMTP server unavailable.', 'info', 8000);
        } else if (data.success) {
            const failNote = data.failed > 0 ? ` (${data.failed} failed — check server logs)` : '';
            showMeetingStatus(`Meeting cancelled. Notifications sent to ${data.sent} member${data.sent !== 1 ? 's' : ''}${failNote}.`, 'info', 8000);
        } else {
            showMeetingStatus('Meeting cancelled. Could not send notifications.', 'info', 8000);
        }
    } catch {
        showMeetingStatus('Meeting cancelled. Notifications not sent — server unreachable.', 'info', 8000);
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
                ${m.status === 'scheduled' && meetingsIsAdmin ? `
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
                : m.status === 'scheduled'
                ? `<span style="color:#94a3b8;font-size:0.75rem;font-family:monospace;">—</span>`
                : `<span style="color:#475569;font-size:0.75rem;font-family:monospace;display:inline-flex;align-items:center;gap:5px;"><i class="fas fa-ban"></i> Cancelled</span>`}
            </td>
        </tr>`;
    }).join('');
}

function filterMeetings() {
    const query  = (document.getElementById('meetingSearch')?.value || '').toLowerCase();
    const status = document.getElementById('meetingStatusFilter')?.value || '';
    const rows = allMeetings
        .filter(m =>
            m.status !== 'archived' &&
            (!query  || m.title.toLowerCase().includes(query) || (m.location || '').toLowerCase().includes(query)) &&
            (!status || m.status === status)
        )
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    renderMeetingRows(rows);
}

function confirmCancelMeeting(id, name) {
    document.getElementById('cancelMeetingName').textContent = name;
    document.getElementById('confirmCancelMeetingBtn').onclick = () => executeCancelMeeting(id);
    document.getElementById('cancelMeetingModal').hidden = false;
}

function executeCancelMeeting(id) {
    document.getElementById('cancelMeetingModal').hidden = true;
    const meetings = getMeetingsData();
    const idx = meetings.findIndex(m => String(m.id) === String(id));
    if (idx !== -1) {
        const meeting = meetings[idx];
        meetings[idx].status = 'cancelled';
        saveMeetingsData(meetings);
        allMeetings = meetings;
        filterMeetings();
        const dbId = Number(id);
        if (!isNaN(dbId) && dbId > 0) {
            fetch(`/api/meetings/${dbId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' })
            }).catch(err => console.error('[Meetings] DB cancel sync failed:', err));
        }
        sendCancelNotification(meeting);
    }
}

function executeCompleteMeeting(id) {
    const meetings = getMeetingsData();
    const idx = meetings.findIndex(m => String(m.id) === String(id));
    if (idx !== -1) {
        meetings[idx].status = 'completed';
        saveMeetingsData(meetings);
        allMeetings = meetings;
        filterMeetings();
        showMeetingStatus('Meeting marked as completed.', 'success');
        const dbId = Number(id);
        if (!isNaN(dbId) && dbId > 0) {
            fetch(`/api/meetings/${dbId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            }).catch(err => console.error('[Meetings] DB complete sync failed:', err));
        }
    }
}

function showMeetingStatus(message, type, duration = 4000) {
    const el = document.getElementById('meetingStatus');
    if (!el) return;
    el.className = `upload-status ${type}`;
    el.innerHTML = `<p>${escHtml(message)}</p>`;
    el.hidden = false;
    setTimeout(() => { if (el) el.hidden = true; }, duration);
}

// ── SCRUM-53: Meeting Links ───────────────────────────────────

function detectPlatform(url) {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.includes('zoom.us'))
        return { name: 'Zoom',        color: '#2D8CFF', bg: '#2D8CFF1a', border: '#2D8CFF33' };
    if (u.includes('teams.microsoft.com') || u.includes('teams.live.com'))
        return { name: 'Teams',       color: '#6264A7', bg: '#6264A71a', border: '#6264A733' };
    if (u.includes('meet.google.com'))
        return { name: 'Google Meet', color: '#00BFA5', bg: '#00BFA51a', border: '#00BFA533' };
    if (u.startsWith('http://') || u.startsWith('https://'))
        return { name: 'Virtual',     color: '#67e8f9', bg: '#0891b21a', border: '#0891b233' };
    return null;
}

function buildMeetingLinkCard(m) {
    const d = new Date(`${m.date}T${m.time}`);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isVirtualLink = m.location && (m.location.startsWith('http://') || m.location.startsWith('https://'));
    const platform = detectPlatform(m.location);

    const typeStyle  = {
        'in-person': 'background:#7c3aed1a;color:#a78bfa;border:1px solid #7c3aed33;',
        virtual:     'background:#0891b21a;color:#67e8f9;border:1px solid #0891b233;',
        hybrid:      'background:#d977061a;color:#fcd34d;border:1px solid #d9770633;'
    };
    const typeLabels = { 'in-person': 'In-Person', virtual: 'Virtual', hybrid: 'Hybrid' };

    const platformBadge = platform
        ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-family:monospace;background:${platform.bg};color:${platform.color};border:1px solid ${platform.border};">
               <i class="fas fa-video" style="font-size:9px;"></i>${platform.name}
           </span>`
        : `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-family:monospace;${typeStyle[m.type]||''}">${typeLabels[m.type]||m.type}</span>`;

    const joinBtn = isVirtualLink
        ? `<a href="${escHtml(m.location)}" target="_blank" rel="noopener" style="
               display:inline-flex;align-items:center;gap:7px;padding:8px 16px;
               background:linear-gradient(135deg,#1d4ed8,#3b82f6);border:1px solid #3b82f666;
               border-radius:8px;color:#fff;font-family:monospace;font-size:0.82rem;
               font-weight:600;text-decoration:none;">
               <i class="fas fa-arrow-up-right-from-square" style="font-size:0.75rem;"></i>Join
           </a>`
        : '';

    const adminBtn = meetingsIsAdmin
        ? `<button onclick="openLinkModal('${m.id}')"
               style="display:inline-flex;align-items:center;gap:6px;padding:7px 13px;
                      background:#0b1523;border:1px solid #16263b;border-radius:8px;
                      color:#94a3b8;font-family:monospace;font-size:0.8rem;cursor:pointer;"
               onmouseover="this.style.borderColor='#3b82f655';this.style.color='#e6e6ef';"
               onmouseout="this.style.borderColor='#16263b';this.style.color='#94a3b8';">
               <i class="fas fa-${isVirtualLink ? 'pen' : 'plus'}"></i>${isVirtualLink ? 'Edit Link' : 'Add Link'}
           </button>`
        : '';

    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;
                padding:14px 18px;margin-bottom:8px;background:#0b1523;border:1px solid #16263b;
                border-radius:10px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1;">
            <div style="width:38px;height:38px;border-radius:50%;background:#1e293b;border:1px solid #3b3f82;
                        display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fas fa-${isVirtualLink ? 'video' : 'calendar'}" style="color:#60a5fa;font-size:0.7rem;"></i>
            </div>
            <div style="min-width:0;">
                <span style="display:block;font-weight:600;color:#e6e6ef;font-family:monospace;
                             white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;">${escHtml(m.title)}</span>
                <span style="font-size:0.75rem;color:#64748b;font-family:monospace;">${dateStr} &bull; ${timeStr}</span>
                ${m.location && !isVirtualLink
                    ? `<span style="display:block;font-size:0.72rem;color:#475569;font-family:monospace;margin-top:2px;">${escHtml(m.location)}</span>`
                    : isVirtualLink
                    ? `<span style="display:block;font-size:0.72rem;color:#475569;font-family:monospace;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;">${escHtml(m.location)}</span>`
                    : ''}
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap;">
            ${platformBadge}
            ${joinBtn}
            ${adminBtn}
        </div>
    </div>`;
}

function renderMeetingLinksTab() {
    const container = document.getElementById('meetingLinksContent');
    if (!container) return;

    const now = new Date();
    const meetings = getMeetingsData()
        .filter(m => m.status !== 'archived' && m.status !== 'cancelled')
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    const upcoming = meetings.filter(m => new Date(`${m.date}T${m.time}`) >= now);
    const past     = meetings.filter(m => new Date(`${m.date}T${m.time}`) < now);

    // Members only see meetings that have a virtual link
    const visibleUpcoming = meetingsIsAdmin
        ? upcoming
        : upcoming.filter(m => m.location && (m.location.startsWith('http://') || m.location.startsWith('https://')));

    let html = '';

    if (!meetingsIsAdmin && !visibleUpcoming.length) {
        container.innerHTML = `<div style="padding:24px 20px;text-align:center;color:#475569;font-family:monospace;font-size:0.85rem;background:#0b1523;border:1px solid #16263b;border-radius:10px;">
            No virtual meeting links available yet. Check back when meetings are scheduled.
        </div>`;
        return;
    }

    if (!meetings.length) {
        container.innerHTML = `<div style="padding:24px 20px;text-align:center;color:#475569;font-family:monospace;font-size:0.85rem;background:#0b1523;border:1px solid #16263b;border-radius:10px;">
            No meetings scheduled yet. Create meetings in the Schedule tab first.
        </div>`;
        return;
    }

    if (visibleUpcoming.length) {
        html += `<div style="font-size:0.7rem;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Upcoming Meetings</div>`;
        html += visibleUpcoming.map(m => buildMeetingLinkCard(m)).join('');
    } else {
        html += `<div style="padding:20px;text-align:center;color:#475569;font-family:monospace;font-size:0.85rem;background:#0b1523;border:1px solid #16263b;border-radius:10px;margin-bottom:12px;">
            No upcoming meetings. Use the Schedule tab to add one.
        </div>`;
    }

    if (meetingsIsAdmin && past.length) {
        html += `<div style="font-size:0.7rem;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px;">Past Meetings</div>`;
        html += past.map(m => buildMeetingLinkCard(m)).join('');
    }

    container.innerHTML = html;
}

function openLinkModal(meetingId) {
    const m = getMeetingsData().find(x => String(x.id) === String(meetingId));
    if (!m) return;
    document.getElementById('linkModalTitle').textContent = m.location ? 'Edit Meeting Link' : 'Add Meeting Link';
    document.getElementById('linkModalMeetingName').textContent = m.title;
    document.getElementById('linkModalMeetingId').value = meetingId;
    document.getElementById('linkModalUrl').value = m.location || '';
    document.getElementById('linkModalError').hidden = true;
    document.getElementById('meetingLinkModal').hidden = false;
}

async function saveMeetingLink() {
    const meetingId = document.getElementById('linkModalMeetingId').value;
    const url       = document.getElementById('linkModalUrl').value.trim();
    const errorEl   = document.getElementById('linkModalError');
    errorEl.hidden  = true;

    const dbId = Number(meetingId);
    if (!isNaN(dbId) && dbId > 0) {
        try {
            const resp = await fetch(`/api/meetings/${dbId}/link`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location: url })
            });
            if (!resp.ok) {
                const d = await resp.json().catch(() => ({}));
                errorEl.textContent = d.message || 'Failed to save link.';
                errorEl.hidden = false;
                return;
            }
        } catch {
            errorEl.textContent = 'Network error. Please try again.';
            errorEl.hidden = false;
            return;
        }
    }

    const meetings = getMeetingsData();
    const idx = meetings.findIndex(m => String(m.id) === String(meetingId));
    if (idx !== -1) {
        meetings[idx].location = url;
        saveMeetingsData(meetings);
        allMeetings = meetings;
    }

    document.getElementById('meetingLinkModal').hidden = true;
    renderMeetingLinksTab();
    showMeetingStatus('Meeting link saved successfully.', 'success');
}

async function loadMeetingsFromApi() {
    try {
        const resp = await fetch('/api/meetings');
        if (!resp.ok) return;
        const data = await resp.json();
        if (!Array.isArray(data.meetings)) return;
        const existing = getMeetingsData();
        allMeetings = data.meetings.map(m => {
            const local = existing.find(e => String(e.id) === String(m.id));
            return {
                id: m.id,
                title: m.title,
                date: m.date,
                time: m.time,
                duration: m.duration || '1 hr',
                type: m.type || 'in-person',
                location: m.location || '',
                agenda: m.agenda || '',
                status: m.status || 'scheduled',
                minutes: local?.minutes || m.minutes || '',
                created_at: m.created_at
            };
        });
        saveMeetingsData(allMeetings);
        autoArchiveMeetings();
        filterMeetings();
        refreshMinutesTab();
    } catch (err) {
        console.error('[Meetings] API load failed, using localStorage:', err);
    }
}

// ── SCRUM-54: Meeting Minutes ──────────────────────────────

function buildMinutesTabHtml(meetings) {
    const relevant = meetings.filter(m => m.status !== 'cancelled');
    if (relevant.length === 0) {
        return '<p style="color:#94a3b8;font-family:monospace;padding:24px 0;text-align:center;">No meetings yet. Create meetings in the Schedule tab first.</p>';
    }
    const statusStyle = {
        scheduled: 'background:#3b82f61a;color:#60a5fa;border:1px solid #3b82f633;',
        completed: 'background:#10b9811a;color:#34d399;border:1px solid #10b98133;',
        archived:  'background:#7c3aed1a;color:#a78bfa;border:1px solid #7c3aed33;'
    };

    const rows = relevant.map(m => {
        const d = new Date(`${m.date}T${m.time}`);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const hasMinutes = !!(m.minutes && m.minutes.trim());
        const style = statusStyle[m.status] || '';
        const minutesCell = hasMinutes
            ? '<span style="color:#34d399;font-size:0.8rem;font-family:monospace;display:inline-flex;align-items:center;gap:5px;"><i class="fas fa-circle-check"></i> Recorded</span>'
            : '<span style="color:#475569;font-size:0.8rem;font-family:monospace;">— Not yet</span>';
        const actionBtn = `<button class="mtg-act-btn ${hasMinutes ? 'reschedule-btn' : 'complete-btn'}" onclick="openMinutesModal('${m.id}')"><i class="fas fa-file-lines"></i> ${hasMinutes ? 'Edit Minutes' : 'Record Minutes'}</button>`;
        return `<tr>
            <td><span style="font-weight:600;color:#e6e6ef;">${escHtml(m.title)}</span></td>
            <td style="color:#94a3b8;font-size:0.85rem;font-family:monospace;white-space:nowrap;">${dateStr}</td>
            <td><span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:12px;font-size:0.72rem;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;${style}">${m.status}</span></td>
            <td>${minutesCell}</td>
            <td>${actionBtn}</td>
        </tr>`;
    }).join('');

    return `<div class="members-table-wrapper" style="overflow-x:auto;">
        <table class="members-table" style="min-width:580px;">
            <thead>
                <tr>
                    <th style="min-width:200px;">Meeting</th>
                    <th style="min-width:130px;">Date</th>
                    <th style="min-width:110px;">Status</th>
                    <th style="min-width:130px;">Minutes</th>
                    <th style="min-width:160px;">Action</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

function refreshMinutesTab() {
    const container = document.getElementById('minutesTabContent');
    if (container) container.innerHTML = buildMinutesTabHtml(getMeetingsData());
}

function openMinutesModal(meetingId) {
    const m = getMeetingsData().find(x => String(x.id) === String(meetingId));
    if (!m) return;
    const d = new Date(`${m.date}T${m.time}`);
    const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const typeLabel = { 'in-person': 'In-Person', virtual: 'Virtual', hybrid: 'Hybrid' }[m.type] || m.type;
    document.getElementById('minutesModalMeeting').textContent = m.title;
    document.getElementById('minutesModalMeta').textContent = `${dateStr} at ${timeStr} · ${typeLabel}`;
    document.getElementById('minutesMeetingId').value = meetingId;
    document.getElementById('minutesText').value = m.minutes || '';
    document.getElementById('minutesModalError').hidden = true;
    document.getElementById('minutesModal').hidden = false;
}

function saveMinutes() {
    const meetingId = document.getElementById('minutesMeetingId').value;
    const text = document.getElementById('minutesText').value.trim();
    const errorEl = document.getElementById('minutesModalError');

    if (!text) {
        errorEl.textContent = 'Minutes cannot be empty.';
        errorEl.hidden = false;
        return;
    }

    const meetings = getMeetingsData();
    const idx = meetings.findIndex(m => m.id === meetingId);
    if (idx !== -1) {
        meetings[idx].minutes = text;
        saveMeetingsData(meetings);
        allMeetings = meetings;
    }

    document.getElementById('minutesModal').hidden = true;
    refreshMinutesTab();
    showMeetingStatus('Meeting minutes saved successfully.', 'success');
}

// ── SCRUM-55: Past Meetings (Admin) ───────────────────────────

let _currentApmId = null;

function renderPastMeetingsTab() {
    const container = document.getElementById('adminPastMeetingsList');
    if (!container) return;

    const now = new Date();
    const typeLabels = { 'in-person':'In-Person', virtual:'Virtual', hybrid:'Hybrid' };
    const typeStyle  = {
        'in-person': 'background:#7c3aed1a;color:#a78bfa;border:1px solid #7c3aed33;',
        virtual:     'background:#0891b21a;color:#67e8f9;border:1px solid #0891b233;',
        hybrid:      'background:#d977061a;color:#fcd34d;border:1px solid #d9770633;'
    };
    const statusStyle = {
        scheduled: 'background:#3b82f61a;color:#60a5fa;border:1px solid #3b82f633;',
        completed: 'background:#10b9811a;color:#34d399;border:1px solid #10b98133;',
        cancelled: 'background:#ef44441a;color:#f87171;border:1px solid #ef444433;'
    };

    const past = getMeetingsData()
        .filter(m => new Date(`${m.date}T${m.time}`) < now && m.status !== 'archived')
        .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));

    if (!past.length) {
        container.innerHTML = `<div style="padding:24px 20px;text-align:center;color:#475569;font-family:monospace;font-size:0.85rem;background:#0b1523;border:1px solid #16263b;border-radius:10px;">No past meetings yet.</div>`;
        return;
    }

    container.innerHTML = past.map(m => {
        const d = new Date(`${m.date}T${m.time}`);
        const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
        const hasMinutes = !!(m.minutes && m.minutes.trim());
        return `<div class="admin-past-card" data-apm-id="${m.id}"
            style="display:flex;align-items:center;justify-content:space-between;gap:16px;
            padding:14px 18px;margin-bottom:8px;background:#0b1523;border:1px solid #16263b;
            border-radius:10px;cursor:pointer;transition:border-color .15s,background .15s;"
            onmouseover="this.style.borderColor='#3b82f655';this.style.background='#101c2e';"
            onmouseout="this.style.borderColor='#16263b';this.style.background='#0b1523';">
            <div style="display:flex;align-items:center;gap:14px;min-width:0;">
                <div style="width:36px;height:36px;border-radius:50%;background:#1e293b;border:1px solid #3b3f82;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-users" style="color:#a78bfa;font-size:0.65rem;"></i>
                </div>
                <div style="min-width:0;">
                    <span style="display:block;font-weight:600;color:#e6e6ef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;">${escHtml(m.title)}</span>
                    <span style="font-size:0.76rem;color:#64748b;font-family:monospace;">${dateStr} &bull; ${timeStr}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                <span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${typeStyle[m.type]||''}">${typeLabels[m.type]||m.type}</span>
                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${statusStyle[m.status]||''}">${m.status}</span>
                ${hasMinutes
                    ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.7rem;font-family:monospace;color:#34d399;"><i class="fas fa-circle-check" style="font-size:9px;"></i> Minutes</span>`
                    : `<span style="font-size:0.7rem;font-family:monospace;color:#475569;">No minutes</span>`}
                <i class="fas fa-chevron-right" style="color:#334155;font-size:0.7rem;"></i>
            </div>
        </div>`;
    }).join('');
}

function openAdminPastMeetingModal(id) {
    const m = getMeetingsData().find(x => String(x.id) === String(id));
    if (!m) return;
    _currentApmId = id;

    const d = new Date(`${m.date}T${m.time}`);
    const dateStr = d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

    const typeLabels = { 'in-person':'In-Person', virtual:'Virtual', hybrid:'Hybrid' };
    const typeStyle  = {
        'in-person': 'background:#7c3aed1a;color:#a78bfa;border:1px solid #7c3aed33;',
        virtual:     'background:#0891b21a;color:#67e8f9;border:1px solid #0891b233;',
        hybrid:      'background:#d977061a;color:#fcd34d;border:1px solid #d9770633;'
    };
    const statusStyle = {
        scheduled: 'background:#3b82f61a;color:#60a5fa;border:1px solid #3b82f633;',
        completed: 'background:#10b9811a;color:#34d399;border:1px solid #10b98133;',
        cancelled: 'background:#ef44441a;color:#f87171;border:1px solid #ef444433;'
    };
    const statusIcon = {
        scheduled: 'fas fa-calendar-check',
        completed: 'fas fa-circle-check',
        cancelled: 'fas fa-ban'
    };

    document.getElementById('apmTitle').textContent = m.title;
    document.getElementById('apmBadges').innerHTML =
        `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${typeStyle[m.type]||''}">${typeLabels[m.type]||m.type}</span>
         <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${statusStyle[m.status]||''}"><i class="${statusIcon[m.status]||'fas fa-circle'}" style="font-size:9px;"></i> ${m.status}</span>`;

    const isLink = m.location && (m.location.startsWith('http://') || m.location.startsWith('https://'));
    const locationVal = m.location
        ? (isLink ? `<a href="${escHtml(m.location)}" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:none;word-break:break-all;">${escHtml(m.location)}</a>`
                  : `<span style="color:#e6e6ef;">${escHtml(m.location)}</span>`)
        : `<span style="color:#475569;">—</span>`;

    const detailItem = (icon, label, val) =>
        `<div style="background:#060e1a;border:1px solid #16263b;border-radius:8px;padding:12px 14px;">
            <div style="font-size:0.68rem;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;"><i class="fas ${icon}" style="margin-right:5px;"></i>${label}</div>
            <div style="font-size:0.85rem;">${val}</div>
        </div>`;

    document.getElementById('apmDetails').innerHTML =
        detailItem('fa-calendar', 'Date', `<span style="color:#e6e6ef;">${dateStr}</span>`) +
        detailItem('fa-clock', 'Time', `<span style="color:#e6e6ef;">${timeStr} &bull; ${escHtml(m.duration||'')}</span>`) +
        detailItem('fa-location-dot', 'Location', locationVal) +
        (m.agenda ? detailItem('fa-list', 'Agenda', `<span style="color:#94a3b8;font-size:0.8rem;">${escHtml(m.agenda)}</span>`) : '');

    const hasMinutes = !!(m.minutes && m.minutes.trim());
    document.getElementById('apmMinutes').innerHTML = hasMinutes
        ? `<textarea rows="8" readonly style="width:100%;background:#060e1a;border:1px solid #16263b;border-radius:8px;padding:12px 14px;color:#e6e6ef;font-family:monospace;font-size:0.83rem;resize:vertical;outline:none;box-sizing:border-box;line-height:1.6;cursor:default;">${escHtml(m.minutes)}</textarea>`
        : `<div style="padding:16px;background:#060e1a;border:1px solid #16263b;border-radius:8px;color:#475569;font-family:monospace;font-size:0.83rem;font-style:italic;">Minutes not yet available.</div>`;

    const footer = document.getElementById('apmFooter');
    footer.innerHTML = `
        <button id="apmFooterClose" style="background:#0b1523;border:1px solid #16263b;border-radius:8px;padding:10px 16px;color:#e6e6ef;font-family:monospace;font-size:0.9rem;cursor:pointer;">Close</button>
        <button id="apmFooterMinutes" style="background:linear-gradient(135deg,#065f46,#10b981);border:1px solid #10b98155;border-radius:8px;padding:10px 20px;color:#fff;font-family:monospace;font-size:0.9rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;">
            <i class="fas fa-file-lines"></i> ${hasMinutes ? 'Edit Minutes' : 'Record Minutes'}
        </button>`;

    document.getElementById('apmFooterClose').addEventListener('click', () => {
        document.getElementById('adminPastMeetingModal').hidden = true;
    });
    document.getElementById('apmFooterMinutes').addEventListener('click', () => {
        document.getElementById('adminPastMeetingModal').hidden = true;
        // Switch to Minutes tab, then open the record modal
        const el = document.getElementById('section-meetings');
        el.querySelectorAll('.meetings-tab').forEach(t => t.classList.remove('active'));
        el.querySelectorAll('.meetings-tab-panel').forEach(p => p.classList.remove('active'));
        const minutesTab = el.querySelector('.meetings-tab[data-tab="minutes"]');
        const minutesPanel = el.querySelector('#tab-minutes');
        if (minutesTab) minutesTab.classList.add('active');
        if (minutesPanel) minutesPanel.classList.add('active');
        refreshMinutesTab();
        openMinutesModal(_currentApmId);
    });

    document.getElementById('adminPastMeetingModal').hidden = false;
}

// ── SCRUM-56: Meeting Archives ────────────────────────────────

function autoArchiveMeetings() {
    const threshold = new Date();
    threshold.setFullYear(threshold.getFullYear() - 1);
    const meetings = getMeetingsData();
    let changed = false;
    meetings.forEach(m => {
        if (m.status !== 'archived' && m.status !== 'cancelled') {
            if (new Date(`${m.date}T${m.time}`) < threshold) {
                m.status = 'archived';
                changed = true;
            }
        }
    });
    if (changed) {
        saveMeetingsData(meetings);
        allMeetings = meetings;
    }
}

function renderArchivesTab() {
    const container = document.getElementById('adminArchivesList');
    if (!container) return;

    const typeLabels = { 'in-person':'In-Person', virtual:'Virtual', hybrid:'Hybrid' };
    const typeStyle  = {
        'in-person': 'background:#7c3aed1a;color:#a78bfa;border:1px solid #7c3aed33;',
        virtual:     'background:#0891b21a;color:#67e8f9;border:1px solid #0891b233;',
        hybrid:      'background:#d977061a;color:#fcd34d;border:1px solid #d9770633;'
    };

    const archived = getMeetingsData()
        .filter(m => m.status === 'archived')
        .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));

    if (!archived.length) {
        container.innerHTML = `<div style="padding:24px 20px;text-align:center;color:#475569;font-family:monospace;font-size:0.85rem;background:#0b1523;border:1px solid #16263b;border-radius:10px;">No archived meetings yet. Meetings are automatically archived 12 months after their date.</div>`;
        return;
    }

    const countBadge = `<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#7c3aed1a;border:1px solid #7c3aed33;border-radius:8px;margin-bottom:16px;font-family:monospace;font-size:0.82rem;color:#a78bfa;">
        <i class="fas fa-box-archive"></i> ${archived.length} archived meeting${archived.length !== 1 ? 's' : ''}</div>`;

    container.innerHTML = countBadge + archived.map(m => {
        const d = new Date(`${m.date}T${m.time}`);
        const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
        const hasMinutes = !!(m.minutes && m.minutes.trim());
        return `<div class="admin-archive-card" data-arch-id="${m.id}"
            style="display:flex;align-items:center;justify-content:space-between;gap:16px;
            padding:14px 18px;margin-bottom:8px;background:#0b1523;border:1px solid #16263b;
            border-radius:10px;cursor:pointer;transition:border-color .15s,background .15s;opacity:0.85;"
            onmouseover="this.style.borderColor='#7c3aed55';this.style.background='#101c2e';this.style.opacity='1';"
            onmouseout="this.style.borderColor='#16263b';this.style.background='#0b1523';this.style.opacity='0.85';">
            <div style="display:flex;align-items:center;gap:14px;min-width:0;">
                <div style="width:36px;height:36px;border-radius:50%;background:#1e293b;border:1px solid #7c3aed55;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-box-archive" style="color:#a78bfa;font-size:0.65rem;"></i>
                </div>
                <div style="min-width:0;">
                    <span style="display:block;font-weight:600;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;">${escHtml(m.title)}</span>
                    <span style="font-size:0.76rem;color:#64748b;font-family:monospace;">${dateStr} &bull; ${timeStr}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                <span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${typeStyle[m.type]||''}">${typeLabels[m.type]||m.type}</span>
                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;background:#7c3aed1a;color:#a78bfa;border:1px solid #7c3aed33;"><i class="fas fa-box-archive" style="font-size:9px;"></i> archived</span>
                ${hasMinutes
                    ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.7rem;font-family:monospace;color:#34d399;"><i class="fas fa-circle-check" style="font-size:9px;"></i> Minutes</span>`
                    : `<span style="font-size:0.7rem;font-family:monospace;color:#475569;">No minutes</span>`}
                <i class="fas fa-chevron-right" style="color:#334155;font-size:0.7rem;"></i>
            </div>
        </div>`;
    }).join('');
}

function openAdminArchiveModal(id) {
    const m = getMeetingsData().find(x => String(x.id) === String(id));
    if (!m) return;
    _currentApmId = id;

    const d = new Date(`${m.date}T${m.time}`);
    const dateStr = d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

    const typeLabels = { 'in-person':'In-Person', virtual:'Virtual', hybrid:'Hybrid' };
    const typeStyle  = {
        'in-person': 'background:#7c3aed1a;color:#a78bfa;border:1px solid #7c3aed33;',
        virtual:     'background:#0891b21a;color:#67e8f9;border:1px solid #0891b233;',
        hybrid:      'background:#d977061a;color:#fcd34d;border:1px solid #d9770633;'
    };

    document.getElementById('archTitle').textContent = m.title;
    document.getElementById('archBadges').innerHTML =
        `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${typeStyle[m.type]||''}">${typeLabels[m.type]||m.type}</span>
         <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;background:#7c3aed1a;color:#a78bfa;border:1px solid #7c3aed33;"><i class="fas fa-box-archive" style="font-size:9px;"></i> Archived</span>`;

    const isLink = m.location && (m.location.startsWith('http://') || m.location.startsWith('https://'));
    const locationVal = m.location
        ? (isLink ? `<a href="${escHtml(m.location)}" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:none;word-break:break-all;">${escHtml(m.location)}</a>`
                  : `<span style="color:#e6e6ef;">${escHtml(m.location)}</span>`)
        : `<span style="color:#475569;">—</span>`;

    const detailItem = (icon, label, val) =>
        `<div style="background:#060e1a;border:1px solid #16263b;border-radius:8px;padding:12px 14px;">
            <div style="font-size:0.68rem;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;"><i class="fas ${icon}" style="margin-right:5px;"></i>${label}</div>
            <div style="font-size:0.85rem;">${val}</div>
        </div>`;

    document.getElementById('archDetails').innerHTML =
        detailItem('fa-calendar', 'Date', `<span style="color:#e6e6ef;">${dateStr}</span>`) +
        detailItem('fa-clock', 'Time', `<span style="color:#e6e6ef;">${timeStr} &bull; ${escHtml(m.duration||'')}</span>`) +
        detailItem('fa-location-dot', 'Location', locationVal) +
        (m.agenda ? detailItem('fa-list', 'Agenda', `<span style="color:#94a3b8;font-size:0.8rem;">${escHtml(m.agenda)}</span>`) : '');

    const hasMinutes = !!(m.minutes && m.minutes.trim());
    document.getElementById('archMinutes').innerHTML = hasMinutes
        ? `<textarea rows="8" readonly style="width:100%;background:#060e1a;border:1px solid #16263b;border-radius:8px;padding:12px 14px;color:#e6e6ef;font-family:monospace;font-size:0.83rem;resize:vertical;outline:none;box-sizing:border-box;line-height:1.6;cursor:default;">${escHtml(m.minutes)}</textarea>`
        : `<div style="padding:16px;background:#060e1a;border:1px solid #16263b;border-radius:8px;color:#475569;font-family:monospace;font-size:0.83rem;font-style:italic;">Minutes not yet available.</div>`;

    const footer = document.getElementById('archFooter');
    footer.innerHTML = `
        <button id="archFooterClose" style="background:#0b1523;border:1px solid #16263b;border-radius:8px;padding:10px 16px;color:#e6e6ef;font-family:monospace;font-size:0.9rem;cursor:pointer;">Close</button>
        <button id="archFooterMinutes" style="background:linear-gradient(135deg,#065f46,#10b981);border:1px solid #10b98155;border-radius:8px;padding:10px 20px;color:#fff;font-family:monospace;font-size:0.9rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;">
            <i class="fas fa-file-lines"></i> ${hasMinutes ? 'Edit Minutes' : 'Record Minutes'}
        </button>`;

    document.getElementById('archFooterClose').addEventListener('click', () => {
        document.getElementById('adminArchiveModal').hidden = true;
    });
    document.getElementById('archFooterMinutes').addEventListener('click', () => {
        document.getElementById('adminArchiveModal').hidden = true;
        const el = document.getElementById('section-meetings');
        el.querySelectorAll('.meetings-tab').forEach(t => t.classList.remove('active'));
        el.querySelectorAll('.meetings-tab-panel').forEach(p => p.classList.remove('active'));
        const minutesTab = el.querySelector('.meetings-tab[data-tab="minutes"]');
        const minutesPanel = el.querySelector('#tab-minutes');
        if (minutesTab) minutesTab.classList.add('active');
        if (minutesPanel) minutesPanel.classList.add('active');
        refreshMinutesTab();
        openMinutesModal(_currentApmId);
    });

    document.getElementById('adminArchiveModal').hidden = false;
}