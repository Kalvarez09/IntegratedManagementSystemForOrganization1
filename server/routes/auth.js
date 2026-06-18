const express = require('express');
const router = express.Router();
const { registerMember, loginMember, verifyLogin2FA, getMemberCount, updateProfile, getAllMembers, upload, uploadMembersCsv, importMembers, addMember, removeMember, updateMemberRole } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
router.post('/register', registerMember);
router.post('/login', loginMember);
router.post('/2fa/verify-login', verifyLogin2FA);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/members/count', getMemberCount);
router.get('/members', getAllMembers);
router.put('/update-profile', updateProfile);
router.post('/upload-members', upload.single('file'), uploadMembersCsv);
router.post('/import-members', importMembers);
router.post('/members', addMember);
router.delete('/members/:id', removeMember);
router.patch('/members/:id/role', updateMemberRole); 


module.exports = router;
