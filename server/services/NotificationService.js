const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const nodemailer = require('nodemailer');
const pool = require('../database/database');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com'
    }
});

async function checkSmtp() {
    try {
        await transporter.verify();
    } catch (err) {
        const e = new Error(err.message);
        e.isSmtpUnavailable = true;
        throw e;
    }
}

async function getActiveMembers() {
    const result = await pool.query('SELECT full_name, email FROM members');
    return result.rows;
}

function fmtDate(date, time) {
    const d = new Date(`${date}T${time}`);
    return {
        dateStr: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
}

function emailCreated(meeting, member) {
    const { dateStr, timeStr } = fmtDate(meeting.date, meeting.time);
    const agendaRow = meeting.agenda
        ? `<tr><td style="padding:10px 14px;background:#f1f5f9;font-weight:600;color:#1e293b;vertical-align:top;">Agenda</td><td style="padding:10px 14px;background:#f1f5f9;color:#374151;">${meeting.agenda}</td></tr>`
        : '';
    return {
        subject: `Meeting Scheduled: ${meeting.title}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:8px;">
            <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0;">
                <h1 style="color:#fff;margin:0;font-size:20px;">New Meeting Scheduled</h1>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">
                <p style="color:#374151;margin:0 0 16px;">Hi ${member.full_name},</p>
                <p style="color:#374151;margin:0 0 20px;">A new meeting has been scheduled. Here are the details:</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr><td style="padding:10px 14px;background:#f1f5f9;font-weight:600;color:#1e293b;width:130px;">Title</td><td style="padding:10px 14px;background:#f1f5f9;color:#374151;">${meeting.title}</td></tr>
                    <tr><td style="padding:10px 14px;font-weight:600;color:#1e293b;">Date</td><td style="padding:10px 14px;color:#374151;">${dateStr}</td></tr>
                    <tr><td style="padding:10px 14px;background:#f1f5f9;font-weight:600;color:#1e293b;">Time</td><td style="padding:10px 14px;background:#f1f5f9;color:#374151;">${timeStr}${meeting.duration ? ' &middot; ' + meeting.duration : ''}</td></tr>
                    <tr><td style="padding:10px 14px;font-weight:600;color:#1e293b;">Location</td><td style="padding:10px 14px;color:#374151;">${meeting.location || 'To be announced'}</td></tr>
                    ${agendaRow}
                </table>
                <p style="color:#64748b;font-size:13px;margin:0;">Please mark your calendar. You will be notified of any changes.</p>
            </div>
        </div>`
    };
}

function emailUpdated(meeting, member) {
    const { dateStr, timeStr } = fmtDate(meeting.date, meeting.time);
    const agendaRow = meeting.agenda
        ? `<tr><td style="padding:10px 14px;background:#fffbeb;font-weight:600;color:#1e293b;vertical-align:top;">Agenda</td><td style="padding:10px 14px;background:#fffbeb;color:#374151;">${meeting.agenda}</td></tr>`
        : '';
    return {
        subject: `Meeting Rescheduled: ${meeting.title}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:8px;">
            <div style="background:#d97706;padding:20px 24px;border-radius:8px 8px 0 0;">
                <h1 style="color:#fff;margin:0;font-size:20px;">Meeting Updated</h1>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">
                <p style="color:#374151;margin:0 0 16px;">Hi ${member.full_name},</p>
                <p style="color:#374151;margin:0 0 20px;">A meeting has been updated. Please review the new details:</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr><td style="padding:10px 14px;background:#fffbeb;font-weight:600;color:#1e293b;width:130px;">Title</td><td style="padding:10px 14px;background:#fffbeb;color:#374151;">${meeting.title}</td></tr>
                    <tr><td style="padding:10px 14px;font-weight:600;color:#1e293b;">New Date</td><td style="padding:10px 14px;color:#374151;">${dateStr}</td></tr>
                    <tr><td style="padding:10px 14px;background:#fffbeb;font-weight:600;color:#1e293b;">New Time</td><td style="padding:10px 14px;background:#fffbeb;color:#374151;">${timeStr}${meeting.duration ? ' &middot; ' + meeting.duration : ''}</td></tr>
                    <tr><td style="padding:10px 14px;font-weight:600;color:#1e293b;">Location</td><td style="padding:10px 14px;color:#374151;">${meeting.location || 'To be announced'}</td></tr>
                    ${agendaRow}
                </table>
                <p style="color:#64748b;font-size:13px;margin:0;">Please update your calendar with the new details.</p>
            </div>
        </div>`
    };
}

function emailCancelled(meeting, member) {
    const { dateStr, timeStr } = fmtDate(meeting.date, meeting.time);
    const locationRow = meeting.location
        ? `<tr><td style="padding:10px 14px;background:#fef2f2;font-weight:600;color:#1e293b;">Location</td><td style="padding:10px 14px;background:#fef2f2;color:#374151;">${meeting.location}</td></tr>`
        : '';
    return {
        subject: `Meeting Cancelled: ${meeting.title}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:8px;">
            <div style="background:#dc2626;padding:20px 24px;border-radius:8px 8px 0 0;">
                <h1 style="color:#fff;margin:0;font-size:20px;">Meeting Cancelled</h1>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">
                <p style="color:#374151;margin:0 0 16px;">Hi ${member.full_name},</p>
                <p style="color:#374151;margin:0 0 20px;">The following meeting has been cancelled:</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr><td style="padding:10px 14px;background:#fef2f2;font-weight:600;color:#1e293b;width:130px;">Title</td><td style="padding:10px 14px;background:#fef2f2;color:#374151;">${meeting.title}</td></tr>
                    <tr><td style="padding:10px 14px;font-weight:600;color:#1e293b;">Was Scheduled</td><td style="padding:10px 14px;color:#374151;">${dateStr} at ${timeStr}</td></tr>
                    ${locationRow}
                </table>
                <p style="color:#64748b;font-size:13px;margin:0;">Please remove this event from your calendar.</p>
            </div>
        </div>`
    };
}

async function sendToAll(members, buildEmail) {
    let sent = 0, failed = 0;
    for (const member of members) {
        try {
            const { subject, html } = buildEmail(member);
            await transporter.sendMail({
                from: `"Organization" <${process.env.SMTP_USER}>`,
                to: member.email,
                subject,
                html
            });
            sent++;
        } catch (err) {
            console.error(`[NotificationService] Failed to send to ${member.email}:`, err.message);
            failed++;
        }
    }
    return { sent, failed };
}

async function sendMeetingCreatedNotification(meeting) {
    await checkSmtp();
    const members = await getActiveMembers();
    return sendToAll(members, m => emailCreated(meeting, m));
}

async function sendMeetingUpdatedNotification(meeting) {
    await checkSmtp();
    const members = await getActiveMembers();
    return sendToAll(members, m => emailUpdated(meeting, m));
}

async function sendMeetingCancelledNotification(meeting) {
    await checkSmtp();
    const members = await getActiveMembers();
    return sendToAll(members, m => emailCancelled(meeting, m));
}

module.exports = {
    sendMeetingCreatedNotification,
    sendMeetingUpdatedNotification,
    sendMeetingCancelledNotification
};