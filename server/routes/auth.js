const express = require('express');
const router = express.Router();
const { registerMember, loginMember } = require('../controllers/authController');

router.post('/register', registerMember);
router.post('/login', loginMember);

module.exports = router;