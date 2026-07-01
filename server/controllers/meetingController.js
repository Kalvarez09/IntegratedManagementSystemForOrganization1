const pool = require('../database/database');
const {
    sendMeetingCreatedNotification,
    sendMeetingUpdatedNotification,
    sendMeetingCancelledNotification
} = require('../services/notificationService');

pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        date        DATE NOT NULL,
        time        TIME NOT NULL,
        duration    VARCHAR(20)  DEFAULT '1 hr',
        type        VARCHAR(20)  DEFAULT 'in-person',
        location    VARCHAR(500),
        agenda      TEXT,
        status      VARCHAR(20)  DEFAULT 'scheduled',
        minutes     TEXT,
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        created_by  INTEGER REFERENCES members(id) ON DELETE SET NULL
    )
`).catch(err => console.error('[Meetings] Table init error:', err.message));

const ADMIN_ROLES = new Set(['admin', 'president', 'vice_president', 'secretary', 'treasurer', 'technical_lead']);

// ── CRUD ─────────────────────────────────────────────────────

async function listMeetings(req, res) {
    try {
        const result = await pool.query(`
            SELECT id, title,
                   to_char(date, 'YYYY-MM-DD') AS date,
                   to_char(time, 'HH24:MI')    AS time,
                   duration, type, location, agenda, status, minutes, created_at
            FROM meetings
            ORDER BY date ASC, time ASC
        `);
        return res.json({ meetings: result.rows });
    } catch (err) {
        console.error('[MeetingController] listMeetings:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to load meetings.' });
    }
}

async function createMeeting(req, res) {
    const role = req.session?.memberRole;
    if (!role || !ADMIN_ROLES.has(role)) {
        return res.status(403).json({ success: false, message: 'Only admins can schedule meetings.' });
    }
    const { title, date, time, duration, type, location, agenda } = req.body;
    if (!title || !date || !time) {
        return res.status(400).json({ success: false, message: 'Title, date, and time are required.' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO meetings (title, date, time, duration, type, location, agenda, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, title,
                       to_char(date, 'YYYY-MM-DD') AS date,
                       to_char(time, 'HH24:MI')    AS time,
                       duration, type, location, agenda, status, created_at`,
            [title, date, time, duration || '1 hr', type || 'in-person', location || null, agenda || null, req.session.memberId]
        );
        return res.status(201).json({ success: true, meeting: result.rows[0] });
    } catch (err) {
        console.error('[MeetingController] createMeeting:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to create meeting.' });
    }
}

async function updateMeeting(req, res) {
    const role = req.session?.memberRole;
    if (!role || !ADMIN_ROLES.has(role)) {
        return res.status(403).json({ success: false, message: 'Only admins can update meetings.' });
    }
    const { id } = req.params;
    const { title, date, time, duration, type, location, agenda } = req.body;
    if (!title || !date || !time) {
        return res.status(400).json({ success: false, message: 'Title, date, and time are required.' });
    }
    try {
        const result = await pool.query(
            `UPDATE meetings
             SET title=$1, date=$2, time=$3, duration=$4, type=$5, location=$6, agenda=$7
             WHERE id=$8 RETURNING id`,
            [title, date, time, duration || '1 hr', type || 'in-person', location || null, agenda || null, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }
        return res.json({ success: true });
    } catch (err) {
        console.error('[MeetingController] updateMeeting:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to update meeting.' });
    }
}

async function updateMeetingStatus(req, res) {
    const role = req.session?.memberRole;
    if (!role || !ADMIN_ROLES.has(role)) {
        return res.status(403).json({ success: false, message: 'Only admins can update meetings.' });
    }
    const { id } = req.params;
    const { status } = req.body;
    const VALID = new Set(['scheduled', 'completed', 'cancelled', 'archived']);
    if (!VALID.has(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    try {
        const result = await pool.query(
            'UPDATE meetings SET status=$1 WHERE id=$2 RETURNING id',
            [status, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Meeting not found.' });
        }
        return res.json({ success: true });
    } catch (err) {
        console.error('[MeetingController] updateMeetingStatus:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to update meeting status.' });
    }
}

// ── Notifications ─────────────────────────────────────────────

async function notifyCreate(req, res) {
    const meeting = req.body;
    if (!meeting.title || !meeting.date || !meeting.time) {
        return res.status(400).json({ success: false, message: 'Missing required meeting fields.' });
    }
    try {
        const { sent, failed } = await sendMeetingCreatedNotification(meeting);
        return res.json({ success: true, sent, failed });
    } catch (err) {
        if (err.isSmtpUnavailable) {
            return res.status(503).json({ success: false, smtpUnavailable: true, message: 'SMTP server unavailable.' });
        }
        console.error('[MeetingController] notifyCreate:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to send notifications.' });
    }
}

async function notifyUpdate(req, res) {
    const meeting = req.body;
    if (!meeting.title || !meeting.date || !meeting.time) {
        return res.status(400).json({ success: false, message: 'Missing required meeting fields.' });
    }
    try {
        const { sent, failed } = await sendMeetingUpdatedNotification(meeting);
        return res.json({ success: true, sent, failed });
    } catch (err) {
        if (err.isSmtpUnavailable) {
            return res.status(503).json({ success: false, smtpUnavailable: true, message: 'SMTP server unavailable.' });
        }
        console.error('[MeetingController] notifyUpdate:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to send notifications.' });
    }
}

async function notifyCancel(req, res) {
    const meeting = req.body;
    if (!meeting.title) {
        return res.status(400).json({ success: false, message: 'Missing required meeting fields.' });
    }
    try {
        const { sent, failed } = await sendMeetingCancelledNotification(meeting);
        return res.json({ success: true, sent, failed });
    } catch (err) {
        if (err.isSmtpUnavailable) {
            return res.status(503).json({ success: false, smtpUnavailable: true, message: 'SMTP server unavailable.' });
        }
        console.error('[MeetingController] notifyCancel:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to send notifications.' });
    }
}

async function updateMeetingLink(req, res) {
    const role = req.session?.memberRole;
    if (!role || !ADMIN_ROLES.has(role)) {
        return res.status(403).json({ success: false, message: 'Only admins can update meeting links.' });
    }
    const { id } = req.params;
    const { location } = req.body;
    try {
        const result = await pool.query(
            'UPDATE meetings SET location=$1 WHERE id=$2 RETURNING id',
            [location || null, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Meeting not found.' });
        return res.json({ success: true });
    } catch (err) {
        console.error('[MeetingController] updateMeetingLink:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to update meeting link.' });
    }
}

module.exports = {
    listMeetings, createMeeting, updateMeeting, updateMeetingStatus, updateMeetingLink,
    notifyCreate, notifyUpdate, notifyCancel
};