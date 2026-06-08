const express = require('express');
const router = express.Router();
const { registerMember, loginMember } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');

router.post('/register', registerMember);
router.post('/login', loginMember);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;