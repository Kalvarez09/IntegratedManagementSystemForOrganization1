const express = require('express');
const router  = express.Router();
const { createPoll, getPolls, castVote, deletePoll } = require('../controllers/pollController');

const ADMIN_ROLES = new Set(['admin', 'president', 'vice_president', 'secretary', 'treasurer', 'technical_lead']);

function requireAuth(req, res, next) {
    if (!req.session?.memberId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session?.memberRole || !ADMIN_ROLES.has(req.session.memberRole)) {
        return res.status(403).json({ message: 'Admins only.' });
    }
    next();
}

router.get('/',              requireAuth,  getPolls);
router.post('/',             requireAdmin, createPoll);
router.post('/:pollId/vote', requireAuth,  castVote);
router.delete('/:id',        requireAdmin, deletePoll);

module.exports = router;
