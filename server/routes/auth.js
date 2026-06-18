const express = require('express');
const router = express.Router();
const { registerMember, loginMember, getMemberCount } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');

router.post('/register', registerMember);
router.post('/login', loginMember);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/members/count', getMemberCount);

module.exports = router;
