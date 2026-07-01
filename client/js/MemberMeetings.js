(function () {
      const STORAGE_KEY = 'org_x_meetings';

      function openMinutesModal(id) {
        const m = allMeetings.find(mtg => String(mtg.id) === String(id));
        if (!m) return;
        const d = new Date(`${m.date}T${m.time}`);
        const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
        document.getElementById('memberMinutesTitle').textContent = m.title;
        document.getElementById('memberMinutesMeta').textContent = `${dateStr} at ${timeStr}`;
        document.getElementById('memberMinutesText').value = m.minutes || '';
        document.getElementById('memberMinutesModal').hidden = false;
      }

      function esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

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

      function renderRows(meetings) {
        const tbody = document.getElementById('memberMeetingsBody');
        if (!tbody) return;
        if (!meetings || meetings.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="members-loading">No meetings have been scheduled yet.</td></tr>';
          return;
        }
        tbody.innerHTML = meetings.map(m => {
          const d = new Date(`${m.date}T${m.time}`);
          const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
          const timeStr = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
          const hasMinutes = !!(m.minutes && m.minutes.trim());
          const safeTitle = esc(m.title);
          const safeMeta = `${dateStr} at ${timeStr}`;
          const minutesCell = hasMinutes
            ? `<button class="view-minutes-btn" data-meeting-id="${m.id}" style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:6px;font-family:monospace;font-size:0.75rem;font-weight:600;cursor:pointer;background:#3b82f61a;color:#60a5fa;border:1px solid #3b82f633;white-space:nowrap;"><i class="fas fa-file-lines"></i> View</button>`
            : '<span style="color:#475569;font-size:0.8rem;font-family:monospace;">—</span>';
          return `<tr>
            <td>
              <div class="member-cell">
                <div class="member-avatar-sm" style="background:#0d2045;border-color:#3b3f82;color:#a78bfa;">
                  <i class="fas fa-users" style="font-size:0.6rem;"></i>
                </div>
                <div>
                  <span style="display:block;font-weight:600;color:#e6e6ef;">${esc(m.title)}</span>
                  ${m.agenda ? `<span style="font-size:0.75rem;color:#94a3b8;display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(m.agenda)}</span>` : ''}
                </div>
              </div>
            </td>
            <td>
              <span style="display:block;color:#e6e6ef;">${dateStr}</span>
              <span style="font-size:0.8rem;color:#94a3b8;">${timeStr}</span>
            </td>
            <td style="max-width:200px;">
              <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${m.location?'#e6e6ef':'#475569'};" title="${m.location?esc(m.location):''}">
                ${m.location ? esc(m.location) : '—'}
              </div>
            </td>
            <td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-family:monospace;${typeStyle[m.type]||''}">${typeLabels[m.type]||m.type}</span></td>
            <td style="color:#94a3b8;font-family:monospace;font-size:0.82rem;white-space:nowrap;">${esc(m.duration)}</td>
            <td><span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:12px;font-size:0.72rem;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;${statusStyle[m.status]||''}"><i class="${statusIcon[m.status]||'fas fa-circle'}" style="font-size:9px;"></i>${m.status}</span></td>
            <td>${minutesCell}</td>
          </tr>`;
        }).join('');
      }

      let allMeetings = [];

      function applyFilter() {
        const query  = (document.getElementById('memberMeetingSearch').value || '').toLowerCase();
        const status = document.getElementById('memberMeetingFilter').value || '';
        renderRows(allMeetings.filter(m =>
          (!query  || m.title.toLowerCase().includes(query) || (m.location||'').toLowerCase().includes(query)) &&
          (!status || m.status === status)
        ));
      }

      // ── Past Meetings ────────────────────────────────────────
      function renderPastMeetings() {
        const now = new Date();
        const past = allMeetings
          .filter(m => new Date(`${m.date}T${m.time}`) < now && m.status !== 'archived')
          .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));

        const container = document.getElementById('pastMeetingsList');
        if (!past.length) {
          container.innerHTML = `<div style="padding:24px 20px;text-align:center;color:#475569;font-family:monospace;font-size:0.85rem;background:#0b1523;border:1px solid #16263b;border-radius:10px;">No past meetings yet.</div>`;
          return;
        }
        container.innerHTML = past.map(m => {
          const d = new Date(`${m.date}T${m.time}`);
          const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
          const timeStr = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
          const hasMinutes = !!(m.minutes && m.minutes.trim());
          return `<div class="past-meeting-card" data-past-id="${m.id}"
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
                <span style="display:block;font-weight:600;color:#e6e6ef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;">${esc(m.title)}</span>
                <span style="font-size:0.76rem;color:#64748b;font-family:monospace;">${dateStr} &bull; ${timeStr}</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
              <span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${typeStyle[m.type]||''}">${typeLabels[m.type]||m.type}</span>
              ${hasMinutes
                ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.7rem;font-family:monospace;color:#34d399;"><i class="fas fa-circle-check" style="font-size:9px;"></i> Minutes</span>`
                : `<span style="font-size:0.7rem;font-family:monospace;color:#475569;">No minutes</span>`}
              <i class="fas fa-chevron-right" style="color:#334155;font-size:0.7rem;"></i>
            </div>
          </div>`;
        }).join('');
      }

      function openPastMeetingModal(id) {
        const m = allMeetings.find(mtg => String(mtg.id) === String(id));
        if (!m) return;
        const d = new Date(`${m.date}T${m.time}`);
        const dateStr = d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

        document.getElementById('pmTitle').textContent = m.title;

        const badgesEl = document.getElementById('pmBadges');
        badgesEl.innerHTML = `
          <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${typeStyle[m.type]||''}">${typeLabels[m.type]||m.type}</span>
          <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:10px;font-size:0.7rem;font-family:monospace;${statusStyle[m.status]||''}"><i class="${statusIcon[m.status]||'fas fa-circle'}" style="font-size:9px;"></i>${m.status}</span>`;

        const isLink = m.location && (m.location.startsWith('http://') || m.location.startsWith('https://'));
        const locationVal = m.location
          ? (isLink ? `<a href="${esc(m.location)}" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:none;word-break:break-all;">${esc(m.location)}</a>` : `<span style="color:#e6e6ef;">${esc(m.location)}</span>`)
          : `<span style="color:#475569;">—</span>`;

        const detailItem = (icon, label, val) =>
          `<div style="background:#060e1a;border:1px solid #16263b;border-radius:8px;padding:12px 14px;">
            <div style="font-size:0.68rem;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;"><i class="fas ${icon}" style="margin-right:5px;"></i>${label}</div>
            <div style="font-size:0.85rem;">${val}</div>
          </div>`;

        document.getElementById('pmDetails').innerHTML =
          detailItem('fa-calendar', 'Date', `<span style="color:#e6e6ef;">${dateStr}</span>`) +
          detailItem('fa-clock', 'Time', `<span style="color:#e6e6ef;">${timeStr} &bull; ${esc(m.duration||'')}</span>`) +
          detailItem('fa-location-dot', 'Location', locationVal) +
          (m.agenda ? detailItem('fa-list', 'Agenda', `<span style="color:#94a3b8;font-size:0.8rem;">${esc(m.agenda)}</span>`) : '');

        const pmMinutes = document.getElementById('pmMinutes');
        if (m.minutes && m.minutes.trim()) {
          pmMinutes.innerHTML = `<textarea rows="8" readonly style="width:100%;background:#060e1a;border:1px solid #16263b;border-radius:8px;padding:12px 14px;color:#e6e6ef;font-family:monospace;font-size:0.83rem;resize:vertical;outline:none;box-sizing:border-box;line-height:1.6;cursor:default;">${esc(m.minutes)}</textarea>`;
        } else {
          pmMinutes.innerHTML = `<div style="padding:16px;background:#060e1a;border:1px solid #16263b;border-radius:8px;color:#475569;font-family:monospace;font-size:0.83rem;font-style:italic;">Minutes not yet available.</div>`;
        }

        document.getElementById('pastMeetingModal').hidden = false;
      }

      document.addEventListener('DOMContentLoaded', () => {
        try { allMeetings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { allMeetings = []; }
            renderRows(allMeetings);
            renderPastMeetings();

            // Also fetch fresh data from API
            fetch('/api/meetings')
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data.meetings) && data.meetings.length > 0) {
                        allMeetings = data.meetings;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(allMeetings));
                        renderRows(allMeetings);
                        renderPastMeetings();
                    }
                })
                .catch(() => {}); // silently fall back to localStorage if API fails
        document.getElementById('memberMeetingSearch').addEventListener('input', applyFilter);
        document.getElementById('memberMeetingFilter').addEventListener('change', applyFilter);

        document.getElementById('memberMeetingsBody').addEventListener('click', function(e) {
          const btn = e.target.closest('.view-minutes-btn');
          if (btn) openMinutesModal(btn.dataset.meetingId);
        });

        document.getElementById('pastMeetingsList').addEventListener('click', function(e) {
          const card = e.target.closest('.past-meeting-card');
          if (card) openPastMeetingModal(card.dataset.pastId);
        });

        document.getElementById('closePastMeetingModal').addEventListener('click', () => {
          document.getElementById('pastMeetingModal').hidden = true;
        });
        document.getElementById('closePastMeetingBtn').addEventListener('click', () => {
          document.getElementById('pastMeetingModal').hidden = true;
        });
        document.getElementById('pastMeetingModal').addEventListener('click', function(e) {
          if (e.target === this) this.hidden = true;
        });
      });
    })();