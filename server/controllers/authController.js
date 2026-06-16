const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const pool = require('../database/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { Readable } = require('stream');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = file.originalname.toLowerCase().split('.').pop();
        if (['csv', 'xlsx'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .csv and .xlsx files are accepted.'));
        }
    }
});
const REQUIRED_COLUMNS = ['full_name', 'email'];

const registerMember = async (req, res) => {
    const { full_name, email, password } = req.body;

    try {
        const existing = await pool.query(
            'SELECT * FROM members WHERE email = $1', [email]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO members (full_name, email, password) VALUES ($1, $2, $3)',
            [full_name, email, hashedPassword]
        );

        res.status(201).json({ message: 'Member registered successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginMember = async (req, res) => {
    const { email, password } = req.body;

    try {
        // SCRUM-80: find member by email
        const result = await pool.query(
            'SELECT * FROM members WHERE email = $1', [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const member = result.rows[0];

        // SCRUM-81: verify password with bcrypt
        const passwordMatch = await bcrypt.compare(password, member.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const role = member.role || 'member';

        // SCRUM-104: generate 6-digit email OTP and hold login until verified
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

        req.session.pendingAuth = {
            memberId: member.id,
            memberName: member.full_name,
            memberEmail: member.email,
            memberRole: role,
            otp,
            otpExpiry
        };

        await transporter.sendMail({
            from: `"OrgSystem Security" <${process.env.SMTP_USER}>`,
            to: member.email,
            subject: 'Your login verification code',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:480px; margin:0 auto; padding:32px; background:#f8f9fa; border-radius:12px;">
                    <h2 style="color:#1a1a2e; margin-bottom:8px;">Login Verification</h2>
                    <p style="color:#495057; margin-bottom:24px;">Hi ${member.full_name}, use the code below to complete your login.</p>
                    <div style="background:#ffffff; border:2px solid #dee2e6; border-radius:12px; padding:24px; text-align:center; margin-bottom:24px;">
                        <span style="font-size:40px; font-weight:700; letter-spacing:12px; font-family:monospace; color:#0f3460;">${otp}</span>
                    </div>
                    <p style="color:#6c757d; font-size:13px;">This code expires in <strong>5 minutes</strong>. If you did not attempt to log in, please ignore this email.</p>
                </div>
            `
        });

        res.status(200).json({ status: 'otp_required' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyLogin2FA = async (req, res) => {
    const { token } = req.body;

    if (!req.session.pendingAuth) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    const { memberId, memberName, memberEmail, memberRole, otp, otpExpiry } = req.session.pendingAuth;

    if (Date.now() > otpExpiry) {
        req.session.pendingAuth = null;
        return res.status(401).json({ message: 'Verification code has expired. Please log in again.' });
    }

    if (String(token).trim() !== otp) {
        return res.status(401).json({ message: 'Invalid verification code. Please try again.' });
    }

    // SCRUM-82: create full session after OTP verified
    req.session.pendingAuth = null;
    req.session.memberId = memberId;
    req.session.memberName = memberName;
    req.session.memberEmail = memberEmail;
    req.session.memberRole = memberRole;

    res.status(200).json({
        message: 'Login successful',
        member: { id: memberId, full_name: memberName, email: memberEmail, role: memberRole }
    });
};

const getMemberCount = async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) AS count FROM members');
        res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllMembers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, full_name, email, role, created_at FROM members ORDER BY created_at DESC'
        );
        res.status(200).json({ members: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const uploadMembersCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const ext = req.file.originalname.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx'].includes(ext)) {
        return res.status(400).json({ success: false, message: 'Only .csv and .xlsx files are accepted.' });
    }

    try {
        let rows = [];
        let headers = [];

        if (ext === 'csv') {
            await new Promise((resolve, reject) => {
                Readable.from(req.file.buffer)
                    .pipe(csv())
                    .on('headers', (h) => { headers = h; })
                    .on('data', (row) => rows.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const parsed = xlsx.utils.sheet_to_json(sheet, { defval: '' });
            rows = parsed;
            headers = parsed.length > 0 ? Object.keys(parsed[0]) : [];
        }

        if (!headers || headers.length === 0) {
            return res.status(400).json({ success: false, message: 'File is empty or could not be read.' });
        }

        const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required column(s): ${missingColumns.join(', ')}`
            });
        }

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'File contains no data rows.' });
        }

        const errors = [];
        rows.forEach((row, i) => {
            REQUIRED_COLUMNS.forEach(col => {
                if (!row[col] || String(row[col]).trim() === '') {
                    errors.push(`Row ${i + 1}: '${col}' is missing.`);
                }
            });
        });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: `${errors.length} row(s) have missing data.`,
                errors
            });
        }

        return res.status(200).json({
            success: true,
            message: 'File is valid and ready to import.',
            rowCount: rows.length
        });

    } catch (err) {
        return res.status(400).json({ success: false, message: 'Could not parse file: ' + err.message });
    }
};

const updateProfile = async (req, res) => {
    const { userId, full_name, email, currentPassword, newPassword, updateType } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User not identified. Please log in again.' });
    }

    try {
        if (updateType === 'name') {
            await pool.query(
                'UPDATE members SET full_name = $1 WHERE id = $2',
                [full_name, userId]
            );
            return res.status(200).json({ message: 'Name updated successfully' });
        }

        if (updateType === 'email') {
            const existing = await pool.query(
                'SELECT * FROM members WHERE email = $1 AND id != $2', [email, userId]
            );
            if (existing.rows.length > 0) {
                return res.status(400).json({ message: 'Email already in use' });
            }

            await pool.query(
                'UPDATE members SET email = $1 WHERE id = $2',
                [email, userId]
            );
            return res.status(200).json({ message: 'Email updated successfully' });
        }

        if (updateType === 'password') {
            const result = await pool.query(
                'SELECT * FROM members WHERE id = $1', [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const member = result.rows[0];
            const passwordMatch = await bcrypt.compare(currentPassword, member.password);

            if (!passwordMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await pool.query(
                'UPDATE members SET password = $1 WHERE id = $2',
                [hashedPassword, userId]
            );
            return res.status(200).json({ message: 'Password updated successfully' });
        }

        return res.status(400).json({ message: 'Invalid update type' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addMember = async (req, res) => {
    const { full_name, email, role } = req.body;

    if (!full_name || !email) {
        return res.status(400).json({ message: 'Full name and email are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    try {
        const existing = await pool.query('SELECT * FROM members WHERE email = $1', [email.toLowerCase().trim()]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const memberRole = role === 'admin' ? 'admin' : 'member';

        const result = await pool.query(
            'INSERT INTO members (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role, created_at',
            [full_name.trim(), email.toLowerCase().trim(), hashedPassword, memberRole]
        );

        return res.status(201).json({
            message: `${full_name} added successfully.`,
            member: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const removeMember = async (req, res) => {
    const { id } = req.params;
    const { requestingUserId } = req.body;

    if (String(id) === String(requestingUserId)) {
        return res.status(400).json({ message: 'You cannot remove your own account.' });
    }

    try {
        const result = await pool.query(
            'DELETE FROM members WHERE id = $1 RETURNING id', [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Member not found.' });
        }
        return res.status(200).json({ message: 'Member removed successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerMember, loginMember, verifyLogin2FA, getMemberCount, updateProfile, getAllMembers, upload, uploadMembersCsv, addMember, removeMember };
