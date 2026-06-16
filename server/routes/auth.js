const express = require('express');
const router = express.Router();
const { registerMember, loginMember, getMemberCount, updateProfile, getAllMembers, upload, uploadMembersCsv, addMember, removeMember } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
router.post('/register', registerMember);
router.post('/login', loginMember);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/members/count', getMemberCount);
router.get('/members', getAllMembers);
router.put('/update-profile', updateProfile);
router.post('/upload-members', upload.single('file'), uploadMembersCsv);
router.post('/members', addMember);
router.delete('/members/:id', removeMember);

module.exports = router;
