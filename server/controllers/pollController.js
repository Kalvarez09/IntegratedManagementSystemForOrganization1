const pool = require('../database/database');

pool.query(`
    CREATE TABLE IF NOT EXISTS polls (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        start_date  DATE NOT NULL,
        end_date    DATE NOT NULL,
        access      VARCHAR(20)  DEFAULT 'members' CHECK (access IN ('members', 'admin')),
        status      VARCHAR(20)  DEFAULT 'scheduled' CHECK (status IN ('active', 'scheduled', 'closed')),
        created_by  INTEGER REFERENCES members(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
    )
`).catch(err => console.error('[Polls] polls init error:', err.message));

pool.query(`
    CREATE TABLE IF NOT EXISTS poll_options (
        id          SERIAL PRIMARY KEY,
        poll_id     INTEGER REFERENCES polls(id) ON DELETE CASCADE,
        option_text VARCHAR(500) NOT NULL,
        vote_count  INTEGER      DEFAULT 0,
        position    INTEGER      DEFAULT 0
    )
`).catch(err => console.error('[Polls] poll_options init error:', err.message));

pool.query(`
    CREATE TABLE IF NOT EXISTS votes (
        id        SERIAL PRIMARY KEY,
        poll_id   INTEGER REFERENCES polls(id)         ON DELETE CASCADE,
        option_id INTEGER REFERENCES poll_options(id)  ON DELETE CASCADE,
        member_id INTEGER REFERENCES members(id)       ON DELETE CASCADE,
        voted_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (poll_id, member_id)
    )
`).catch(err => console.error('[Polls] votes init error:', err.message));

const ADMIN_ROLES = new Set(['admin', 'president', 'vice_president', 'secretary', 'treasurer', 'technical_lead']);

// ── SCRUM-27: Admin can create a poll ──────────────────────────────────────────
async function createPoll(req, res) {
    const role = req.session?.memberRole;
    if (!role || !ADMIN_ROLES.has(role)) {
        return res.status(403).json({ success: false, message: 'Only admins can create polls.' });
    }

    const { title, description, options, start_date, end_date, access } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Poll title is required.' });
    }

    const validOptions = Array.isArray(options) ? options.filter(o => o && o.trim()) : [];
    if (validOptions.length < 2) {
        return res.status(400).json({ success: false, message: 'At least two answer options are required.' });
    }

    if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }

    if (new Date(end_date) < new Date(start_date)) {
        return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const status = new Date(start_date) <= today ? 'active' : 'scheduled';
    const validAccess = ['members', 'admin'].includes(access) ? access : 'members';

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const pollResult = await client.query(
            `INSERT INTO polls (title, description, start_date, end_date, access, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, title, description,
                       to_char(start_date, 'YYYY-MM-DD') AS start_date,
                       to_char(end_date,   'YYYY-MM-DD') AS end_date,
                       access, status, created_at`,
            [title.trim(), description?.trim() || null, start_date, end_date, validAccess, status, req.session.memberId || null]
        );

        const poll = pollResult.rows[0];

        for (let i = 0; i < validOptions.length; i++) {
            await client.query(
                'INSERT INTO poll_options (poll_id, option_text, position) VALUES ($1, $2, $3)',
                [poll.id, validOptions[i].trim(), i]
            );
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: 'Poll created successfully.', poll: { ...poll, option_count: validOptions.length } });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PollController] createPoll:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to create poll.' });
    } finally {
        client.release();
    }
}

// ── SCRUM-28/32: Get polls (members see active; admins see all + results) ──────
async function getPolls(req, res) {
    const memberId = req.session?.memberId || null;
    const role     = req.session?.memberRole;
    const isAdmin  = role && ADMIN_ROLES.has(role);

    try {
        // Auto-update status based on current date
        await pool.query(`
            UPDATE polls SET status = 'active'
            WHERE status = 'scheduled' AND CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date;
            UPDATE polls SET status = 'closed'
            WHERE status IN ('scheduled', 'active') AND CURRENT_DATE > end_date;
        `);

        const result = await pool.query(`
            SELECT p.id, p.title, p.description,
                   to_char(p.start_date, 'YYYY-MM-DD') AS start_date,
                   to_char(p.end_date,   'YYYY-MM-DD') AS end_date,
                   p.access, p.status, p.created_at,
                   COUNT(DISTINCT po.id)::int AS option_count,
                   COALESCE(SUM(po.vote_count), 0)::int AS total_votes,
                   json_agg(
                       json_build_object(
                           'id',          po.id,
                           'option_text', po.option_text,
                           'vote_count',  po.vote_count,
                           'position',    po.position
                       ) ORDER BY po.position
                   ) FILTER (WHERE po.id IS NOT NULL) AS options,
                   (SELECT v.option_id FROM votes v
                    WHERE v.poll_id = p.id AND v.member_id = $1) AS my_vote_option_id
            FROM polls p
            LEFT JOIN poll_options po ON po.poll_id = p.id
            ${isAdmin ? '' : "WHERE p.status = 'active' AND p.access = 'members'"}
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [memberId]);

        return res.json({ polls: result.rows });
    } catch (err) {
        console.error('[PollController] getPolls:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to load polls.' });
    }
}

// ── SCRUM-29/30/31: Cast a vote ────────────────────────────────────────────────
async function castVote(req, res) {
    const memberId = req.session?.memberId;
    if (!memberId) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { pollId }  = req.params;
    const { optionId } = req.body;

    if (!optionId) {
        return res.status(400).json({ success: false, message: 'An option must be selected.' });
    }

    try {
        const pollResult = await pool.query('SELECT status FROM polls WHERE id = $1', [pollId]);
        if (pollResult.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Poll not found.' });
        }
        if (pollResult.rows[0].status !== 'active') {
            return res.status(400).json({ success: false, message: 'This poll is not open for voting.' });
        }

        const optCheck = await pool.query(
            'SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2', [optionId, pollId]
        );
        if (optCheck.rowCount === 0) {
            return res.status(400).json({ success: false, message: 'Invalid option for this poll.' });
        }

        // SCRUM-30: UNIQUE(poll_id, member_id) prevents double voting
        await pool.query(
            'INSERT INTO votes (poll_id, option_id, member_id) VALUES ($1, $2, $3)',
            [pollId, optionId, memberId]
        );

        // SCRUM-31: increment vote count automatically
        await pool.query(
            'UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1', [optionId]
        );

        return res.status(200).json({ success: true, message: 'Vote recorded successfully.' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'You have already voted in this poll.' });
        }
        console.error('[PollController] castVote:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to record vote.' });
    }
}

async function deletePoll(req, res) {
    const role = req.session?.memberRole;
    if (!role || !ADMIN_ROLES.has(role)) {
        return res.status(403).json({ success: false, message: 'Only admins can delete polls.' });
    }
    try {
        const result = await pool.query('DELETE FROM polls WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Poll not found.' });
        }
        return res.json({ success: true, message: 'Poll deleted successfully.' });
    } catch (err) {
        console.error('[PollController] deletePoll:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to delete poll.' });
    }
}

module.exports = { createPoll, getPolls, castVote, deletePoll };
