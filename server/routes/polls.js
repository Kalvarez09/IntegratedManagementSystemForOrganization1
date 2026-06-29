const express = require('express');
const router = express.Router();
const { createPoll, getPolls, castVote } = require('../controllers/pollController');
const pool = require('../database/database');

function requireAdmin(req, res, next) {
    if (req.session?.memberRole !== 'admin') {
        return res.status(403).json({ message: 'Admins only.' });
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.session?.memberId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }
    next();
}

router.get('/', requireAuth, getPolls);
router.post('/', requireAdmin, createPoll);
router.post('/:pollId/vote', requireAuth, castVote);

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM polls WHERE id = $1 RETURNING id', [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Poll not found.' });
        }
        res.json({ message: 'Poll deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;