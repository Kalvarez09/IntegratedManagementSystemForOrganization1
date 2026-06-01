const express = require('express');
const router = express.Router();
const { registerMember } = require('../controllers/authController');

router.post('/register', registerMember);

module.exports = router;