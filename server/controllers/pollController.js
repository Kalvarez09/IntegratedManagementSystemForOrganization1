const pool = require('../database/database');

const createPoll = async (req, res) => {
    const { title, description, start_date, end_date, access, options } = req.body;
    

    // Validation
    if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: 'Title, start date, and end date are required.' });
    }
    if (!options || options.length < 2) {
        return res.status(400).json({ message: 'At least two answer options are required.' });
    }
    if (new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ message: 'End date must be after start date.' });
    }

    const now = new Date();
    const start = new Date(start_date);
    const end = new Date(end_date);

    let status = 'scheduled';
    if (now >= start && now <= end) status = 'active';
    if (now > end) status = 'closed';

    try {
        // Insert poll
        const pollResult = await pool.query(
            `INSERT INTO polls (title, description, start_date, end_date, status, access, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, description || null, start_date, end_date, status,
             access || 'members', req.session.memberId || null]
        );

        const poll = pollResult.rows[0];

        // Insert each option
        for (const optionText of options) {
            if (optionText.trim()) {
                await pool.query(
                    `INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2)`,
                    [poll.id, optionText.trim()]
                );
            }
        }

        return res.status(201).json({ message: 'Poll created successfully. YAYYYY', poll });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getPolls = async (req, res) => {
    try {
        await pool.query(`
            UPDATE polls SET status = 'active'
            WHERE status = 'scheduled' AND NOW() >= start_date AND NOW() <= end_date;
            UPDATE polls SET status = 'closed'
            WHERE status IN ('scheduled', 'active') AND NOW() > end_date;
        `);

        const memberId = req.session.memberId || null;
        const isAdmin = req.session.memberRole === 'admin';

                const query = isAdmin ? `
            SELECT p.*, m.full_name AS creator_name,
                json_agg(json_build_object(
                    'id', po.id,
                    'option_text', po.option_text,
                    'vote_count', po.vote_count
                ) ORDER BY po.id) AS options,
                (SELECT pv.option_id FROM votes pv
                    WHERE pv.poll_id = p.id AND pv.member_id = $1) AS my_vote_option_id
            FROM polls p
            LEFT JOIN members m ON p.created_by = m.id
            LEFT JOIN poll_options po ON po.poll_id = p.id
            GROUP BY p.id, m.full_name
            ORDER BY p.created_at DESC`
            : `
            SELECT p.*, m.full_name AS creator_name,
                json_agg(json_build_object(
                    'id', po.id,
                    'option_text', po.option_text,
                    'vote_count', po.vote_count
                ) ORDER BY po.id) AS options,
                (SELECT pv.option_id FROM votes pv
                    WHERE pv.poll_id = p.id AND pv.member_id = $1) AS my_vote_option_id
            FROM polls p
            LEFT JOIN members m ON p.created_by = m.id
            LEFT JOIN poll_options po ON po.poll_id = p.id
            WHERE p.status = 'active' AND p.access = 'members'
            GROUP BY p.id, m.full_name
            ORDER BY p.end_date ASC`;

        const result = await pool.query(query, [memberId]);
        res.status(200).json({ polls: result.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const castVote = async (req, res) => {
    console.log('castVote called, pollId:', req.params.pollId, 'optionId:', req.body.optionId, 'memberId:', req.session.memberId);
    const { pollId } = req.params;
    const { optionId } = req.body;
    const memberId = req.session.memberId;

    if (!memberId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }
    if (!optionId) {
        return res.status(400).json({ message: 'optionId is required.' });
    }

    try {
        const pollResult = await pool.query('SELECT * FROM polls WHERE id = $1', [pollId]);
        const poll = pollResult.rows[0];

        if (!poll) {
            return res.status(404).json({ message: 'Poll not found.' });
        }
        if (poll.status !== 'active') {
            return res.status(400).json({ message: 'This poll is not currently open for voting.' });
        }

        const optionResult = await pool.query(
            'SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2',
            [optionId, pollId]
        );
        if (optionResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid option for this poll.' });
        }

        try {
            await pool.query(
                'INSERT INTO votes (poll_id, option_id, member_id) VALUES ($1, $2, $3)',
                [pollId, optionId, memberId]
            );
            console.log('Vote inserted successfully');
        } catch (error) {
            console.log('Insert failed:', error.message);
            if (error.code === '23505') {
                return res.status(409).json({ message: 'You have already voted in this poll.' });
            }
            throw error;
        }

        await pool.query(
            'UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1',
            [optionId]
        );
        console.log('vote_count incremented for option:', optionId);

        return res.status(200).json({ message: 'Vote recorded.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { createPoll, getPolls, castVote };