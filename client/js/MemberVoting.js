
function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function timeLeft(endDate) {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return 'Closed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
    return `${hours} hour${hours !== 1 ? 's' : ''} left`;
}

window.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('pollsContainer');
    try {
        const res = await fetch('/api/polls');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const polls = data.polls;

        if (polls.length === 0) {
            container.innerHTML = `
                <div class="coming-card">
                    <div class="coming-icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm56 192c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zm184 88c0-13.3 10.7-24 24-24s24 10.7 24 24l0 48c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-48zM224 128c13.3 0 24 10.7 24 24l0 208c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-208c0-13.3 10.7-24 24-24z"/></svg>
                    </div>
                    <h2 class="coming-title">No Active Polls</h2>
                    <p class="coming-desc">There are no polls currently open for voting. Check back later.</p>
                </div>`;
            return;
        }

        container.innerHTML = polls.map(poll => `
            <div class="poll-card">
                <div class="poll-card-header">
                    <div>
                        <h2 class="poll-card-title">${escHtml(poll.title)}</h2>
                        ${poll.description
                            ? `<p class="poll-card-desc">${escHtml(poll.description)}</p>`
                            : ''}
                    </div>
                    <span class="poll-time-left">${timeLeft(poll.end_date)}</span>
                </div>
                <div class="poll-options-list">
                    ${(poll.options || []).filter(o => o.id).map(opt => `
                        <div class="poll-option-display">
                            <i class="fas fa-circle" style="font-size:0.5rem;
                                color:var(--secondary-text-clr);"></i>
                            <span>${escHtml(opt.option_text)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="poll-card-footer">
                    <span class="poll-closes-label">
                        Closes: ${new Date(poll.end_date).toLocaleDateString()}
                    </span>
                    <button class="profile-edit-btn" 
                        onclick="alert('Voting — coming in SCRUM-29')">
                        Cast Vote
                    </button>
                </div>
            </div>
        `).join('');

    } catch {
        container.innerHTML = `
            <p style="color:white;font-family:monospace; border-radius: 6px; padding: 8px 18px; background: #dc2626;">
                Could not load polls. Make sure you are logged in.
            </p>`;
    }
});
