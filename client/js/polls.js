//////////////MEMBER/////////////////////////////////
function getCurrentUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

const pollsListEl = document.getElementById('pollsList');

function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadPolls() {
    pollsListEl.innerHTML = `<div class="polls-loading">Loading polls…</div>`;
    try {
        const res = await fetch('/api/polls');
        if (!res.ok) throw new Error();
        const data = await res.json();
        renderPolls(data.polls || []);
    } catch {
        pollsListEl.innerHTML = `<div class="polls-empty">Could not load polls. Please try again later.</div>`;
    }
}

function renderPolls(polls) {
    if (polls.length === 0) {
        pollsListEl.innerHTML = `<div class="polls-empty">There are no polls yet.</div>`;
        return;
    }

    pollsListEl.innerHTML = polls.map(renderPollCard).join('');

    polls.forEach((poll) => {
        if (poll.status !== 'active' || poll.my_vote_option_id) return;

        (poll.options || []).forEach((opt) => {
            const btn = document.getElementById(`opt-${poll.id}-${opt.id}`);
            if (btn) btn.addEventListener('click', () => selectOption(poll.id, opt.id));
        });

        const submitBtn = document.getElementById(`submit-${poll.id}`);
        if (submitBtn) submitBtn.addEventListener('click', () => submitVote(poll.id));
    });
}

// Marks an option as selected (radio-style: only one at a time) without
// committing anything yet -- AC requires a separate "Submit Vote" step.
function selectOption(pollId, optionId) {
    const card = document.getElementById(`poll-card-${pollId}`);
    if (!card) return;

    card.querySelectorAll('.poll-option').forEach((btn) => {
        btn.classList.toggle('poll-option--selected', btn.id === `opt-${pollId}-${optionId}`);
    });
    card.dataset.selectedOption = optionId;

    const submitBtn = document.getElementById(`submit-${pollId}`);
    if (submitBtn) submitBtn.disabled = false;

    const statusEl = document.getElementById(`poll-status-${pollId}`);
    if (statusEl) statusEl.innerHTML = '';
}

function renderPollCard(poll) {
    const options = poll.options || [];
    const hasVoted = !!poll.my_vote_option_id;
    const isActive = poll.status === 'active';
    const showResults = hasVoted || poll.status === 'closed';
    const canVote = isActive && !hasVoted;
    const totalVotes = options.reduce((sum, o) => sum + (o.vote_count || 0), 0);

    const statusLabel = { active: 'Active', scheduled: 'Scheduled', closed: 'Closed' };
    const statusClass = { active: 'success', scheduled: 'info', closed: '' };

    const optionsHtml = options.map((opt) => {
        const votes = opt.vote_count || 0;
        const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
        const chosen = opt.id === poll.my_vote_option_id;

        return `
        <li>
          <button
            id="opt-${poll.id}-${opt.id}"
            type="button"
            class="poll-option${chosen ? ' poll-option--chosen' : ''}"
            ${canVote ? '' : 'disabled'}
            title="${hasVoted ? 'Already voted' : ''}">
            ${showResults ? `<span class="poll-option__bar" style="width:${pct}%"></span>` : ''}
            <span class="poll-option__row">
              <span class="poll-option__label">${escHtml(opt.option_text)}</span>
              <span class="poll-option__count">${hasVoted ? (chosen ? 'Already voted' : `${votes} · ${pct}%`) : showResults ? `${votes} · ${pct}%` : ''}</span>
            </span>
          </button>
        </li>`;
    }).join('');

    return `
    <div class="poll-card" id="poll-card-${poll.id}">
      <div class="poll-card__head">
        <h3 class="poll-card__title">${escHtml(poll.title)}</h3>
        <span class="poll-status-pill ${statusClass[poll.status] || ''}">${statusLabel[poll.status] || poll.status}</span>
      </div>
      ${poll.description ? `<p class="poll-card__desc">${escHtml(poll.description)}</p>` : ''}
      <ul class="poll-options">${optionsHtml}</ul>
      ${canVote ? `
      <button type="button" id="submit-${poll.id}" class="poll-submit-btn" disabled>
        Submit Vote
      </button>` : ''}
      <div class="poll-card__foot">
        <span class="poll-card__meta">${totalVotes} vote${totalVotes === 1 ? '' : 's'}</span>
        <span class="poll-card__meta">
          ${isActive ? `Closes ${new Date(poll.end_date).toLocaleDateString()}`
            : poll.status === 'scheduled' ? `Opens ${new Date(poll.start_date).toLocaleDateString()}`
            : `Closed ${new Date(poll.end_date).toLocaleDateString()}`}
        </span>
      </div>
      <div class="poll-card__status" id="poll-status-${poll.id}">
        ${hasVoted ? '<span class="poll-status-ok">Already voted. Thanks for your input.</span>' : ''}
      </div>
    </div>`;
}

async function submitVote(pollId) {
    const card = document.getElementById(`poll-card-${pollId}`);
    const statusEl = document.getElementById(`poll-status-${pollId}`);
    const optionId = card?.dataset.selectedOption;

    // AC: trying to submit without selecting an option shows a validation
    // error and does not submit.
    if (!optionId) {
        if (statusEl) {
            statusEl.innerHTML = `<span class="poll-status-error">Please select an option before submitting.</span>`;
        }
        return;
    }

    const submitBtn = document.getElementById(`submit-${pollId}`);
    if (submitBtn) submitBtn.disabled = true;

    try {
        const res = await fetch(`/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ optionId: Number(optionId) }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            if (statusEl) {
                statusEl.innerHTML = `<span class="poll-status-error">${escHtml(data.message || 'Could not record your vote.')}</span>`;
            }
            if (submitBtn) submitBtn.disabled = false;
            // Someone else's vote (or a stale page) may have changed the
            // poll's state -- re-fetch so the card reflects reality.
            loadPolls();
            return;
        }

        if (statusEl) {
            statusEl.innerHTML = `<span class="poll-status-ok">✓ Your vote has been recorded.</span>`;
        }
        loadPolls();
    } catch {
        if (statusEl) {
            statusEl.innerHTML = `<span class="poll-status-error">Network error — your vote was not recorded.</span>`;
        }
        if (submitBtn) submitBtn.disabled = false;
    }
}
document.addEventListener('DOMContentLoaded', loadPolls);
setInterval(() => {
    const hasPendingSelection = document.querySelector('[data-selected-option]');
    if (!hasPendingSelection) {
        loadPolls();
    }
}, 30000);