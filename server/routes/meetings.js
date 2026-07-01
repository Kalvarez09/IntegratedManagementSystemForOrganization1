const express = require('express');
const router = express.Router();
const {
    listMeetings, createMeeting, updateMeeting, updateMeetingStatus, updateMeetingLink,
    notifyCreate, notifyUpdate, notifyCancel
} = require('../controllers/meetingController');

router.get('/',              listMeetings);
router.post('/',             createMeeting);
router.put('/:id',           updateMeeting);
router.patch('/:id/status',  updateMeetingStatus);
router.patch('/:id/link',    updateMeetingLink);

router.post('/notify/create', notifyCreate);
router.post('/notify/update', notifyUpdate);
router.post('/notify/cancel', notifyCancel);

module.exports = router;