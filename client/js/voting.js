// ============================================================
//  Electronic Voting — Member side
//  SCRUM-28: view polls  |  SCRUM-29: cast vote
//  SCRUM-30: prevents double vote  |  SCRUM-31: live counts
// ============================================================

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const user = getUser();
    if (!user) { window.location.href = '../MainPage/Login.html'; return; }

    // Profile bar
    const initials = user.full_name.trim().split(/\s+/).map(p => p[0]).join('').slice(0,2).toUpperCase();
    document.getElementById('avatarInitials').textContent = initials;
    document.getElementById('profileName').textContent    = user.full_name;

    const roleLabels = {
        admin:'Admin', president:'President', vice_president:'Vice President',
        secretary:'Secretary', treasurer:'Treasurer', technical_lead:'Technical Lead', member:'Member'
    };
    const badge = document.getElementById('roleBadge');
    if (badge) {
        badge.textContent = roleLabels[user.role] || 'Member';
        badge.classList.add(user.role in roleLabels ? user.role : 'member');
    }

    // Profile dropdown
    const container = document.getElementById('profileContainer');
    container.addEventListener('click', e => { e.stopPropagation(); container.classList.toggle('open'); });
    document.addEventListener('click', () => container.classList.remove('open'));
    document.getElementById('updateDataBtn').addEventListener('click', e => {
        e.stopPropagation(); window.location.href = 'UpdateProfile.html';
    });
    document.getElementById('logoutBtn').addEventListener('click', e => {
        e.stopPropagation(); localStorage.removeItem('user'); window.location.href = '../MainPage/Login.html';
    });

    await loadPolls();
});

// ── Load and render polls (SCRUM-28) ─────────────────────────
async function loadPolls() {
    try {
        const res  = await fetch('/api/polls');
        const data = await res.json();
        renderPolls(data.polls || []);
    } catch {
        showLoadingState(false);
        showEmptyState(true, 'Could not load polls. Please try again later.');
    }
}

function renderPolls(polls) {
    const loading = document.getElementById('pollsLoadingState');
    const empty   = document.getElementById('pollsEmptyState');
    const grid    = document.getElementById('pollsGrid');

    loading.style.display = 'none';

    if (!polls.length) {
        empty.style.display = 'block';
        grid.style.display  = 'none';
        return;
    }

    empty.style.display = 'none';
    grid.style.display  = 'grid';
    grid.innerHTML      = polls.map(p => buildPollCard(p)).join('');

    // Wire up submit buttons
    polls.forEach(p => {
        const btn = document.getElementById(`voteBtn_${p.id}`);
        if (btn) btn.addEventListener('click', () => submitVote(p.id));
    });
}

function buildPollCard(poll) {
    const options      = poll.options || [];
    const totalVotes   = poll.total_votes || 0;
    const myVoteId     = poll.my_vote_option_id;
    const hasVoted     = myVoteId != null;
    const statusColors = { active: '#4ade80', scheduled: '#7ab8f5', closed: '#94a3b8' };
    const statusColor  = statusColors[poll.status] || '#94a3b8';

    let bodyHtml = '';

    if (hasVoted || poll.status !== 'active') {
        // SCRUM-30: already voted → show results (SCRUM-31: with live counts)
        const suffix = hasVoted ? '<span class="voted-badge"><i class="fas fa-check"></i> Your vote</span>' : '';
        bodyHtml = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                ${hasVoted ? '<span class="voted-badge"><i class="fas fa-check"></i> You voted</span>' : ''}
                <span style="color:var(--secondary-text-clr);font-size:.8rem;font-family:monospace;">
                    ${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}
                </span>
            </div>
            <div>
                ${options.map(o => {
                    const votes   = o.vote_count || 0;
                    const pct     = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isMyVote = String(o.id) === String(myVoteId);
                    return `
                        <div class="result-bar-wrap">
                            <div class="result-bar-label">
                                <span class="result-bar-text">
                                    ${escHtml(o.option_text)}
                                    ${isMyVote ? ' <i class="fas fa-check-circle" style="color:#4ade80;font-size:.75rem;"></i>' : ''}
                                </span>
                                <span class="result-bar-pct">${votes} (${pct}%)</span>
                            </div>
                            <div class="result-bar-track">
                                <div class="result-bar-fill ${isMyVote ? 'my-vote' : ''}" style="width:${pct}%;"></div>
                            </div>
                        </div>`;
                }).join('')}
            </div>`;
    } else {
        // SCRUM-29: active + not voted → show voting form
        bodyHtml = `
            <div class="poll-options" id="pollOpts_${poll.id}">
                ${options.map(o => `
                    <label class="poll-option-label">
                        <input type="radio" name="poll_${poll.id}" value="${o.id}">
                        ${escHtml(o.option_text)}
                    </label>`).join('')}
            </div>
            <div id="pollMsg_${poll.id}"></div>
            <button class="poll-vote-btn" id="voteBtn_${poll.id}">
                <i class="fas fa-check"></i> Cast Vote
            </button>`;
    }

    return `
        <div class="poll-card" id="pollCard_${poll.id}">
            <div class="poll-card-header">
                <h3 class="poll-card-title">${escHtml(poll.title)}</h3>
                <span style="color:${statusColor};font-size:.75rem;font-family:monospace;white-space:nowrap;border:1px solid ${statusColor}44;
                    background:${statusColor}11;border-radius:4px;padding:2px 8px;">
                    ${poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                </span>
            </div>
            ${poll.description ? `<p class="poll-card-desc">${escHtml(poll.description)}</p>` : ''}
            <div class="poll-meta">
                <span class="poll-close-date">
                    <i class="fas fa-calendar-xmark"></i> Closes ${poll.end_date}
                </span>
            </div>
            ${bodyHtml}
        </div>`;
}

// ── Cast vote (SCRUM-29 / 30 / 31) ───────────────────────────
async function submitVote(pollId) {
    const selected = document.querySelector(`input[name="poll_${pollId}"]:checked`);
    const msgEl    = document.getElementById(`pollMsg_${pollId}`);
    const btn      = document.getElementById(`voteBtn_${pollId}`);

    if (msgEl) msgEl.innerHTML = '';

    if (!selected) {
        if (msgEl) msgEl.innerHTML = `<div class="poll-msg error">Please select an option before voting.</div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        const res  = await fetch(`/api/polls/${pollId}/vote`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ optionId: parseInt(selected.value) })
        });
        const data = await res.json();

        if (res.ok) {
            // Reload polls so the card flips to results view (SCRUM-31)
            await loadPolls();
        } else {
            // SCRUM-30: 409 = already voted
            if (msgEl) msgEl.innerHTML = `<div class="poll-msg error">${escHtml(data.message || 'Could not submit vote.')}</div>`;
            btn.disabled  = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Cast Vote';
        }
    } catch {
        if (msgEl) msgEl.innerHTML = `<div class="poll-msg error">Could not connect to server.</div>`;
        btn.disabled  = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Cast Vote';
    }
}

function showLoadingState(show) {
    document.getElementById('pollsLoadingState').style.display = show ? 'block' : 'none';
}

function showEmptyState(show, msg = '') {
    const el = document.getElementById('pollsEmptyState');
    el.style.display = show ? 'block' : 'none';
    if (msg) el.querySelector('p').textContent = msg;
}
