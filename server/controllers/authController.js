const pool = require('../database/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { Readable } = require('stream');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const crypto = require('crypto');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

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
        const result = await pool.query(
            'SELECT * FROM members WHERE email = $1', [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const member = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, member.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const role = member.role || 'member';

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000;

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
                <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:12px;">
                    <h2 style="color:#1a1a2e;margin-bottom:8px;">Login Verification</h2>
                    <p style="color:#495057;margin-bottom:24px;">Hi ${member.full_name}, use the code below to complete your login.</p>
                    <div style="background:#ffffff;border:2px solid #dee2e6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                        <span style="font-size:40px;font-weight:700;letter-spacing:12px;font-family:monospace;color:#0f3460;">${otp}</span>
                    </div>
                    <p style="color:#6c757d;font-size:13px;">This code expires in <strong>5 minutes</strong>. If you did not attempt to log in, please ignore this email.</p>
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

        // Normalize headers: strip BOM, trim, lowercase, spaces/hyphens → underscores, common aliases
        const HEADER_ALIASES = {
            'name':           'full_name',
            'full name':      'full_name',
            'fullname':       'full_name',
            'full_name':      'full_name',
            'member name':    'full_name',
            'member_name':    'full_name',
            'first name':     'full_name',
            'first_name':     'full_name',
            'firstname':      'full_name',
            'display name':   'full_name',
            'display_name':   'full_name',
            'contact name':   'full_name',
            'contact_name':   'full_name',
            'email address':  'email',
            'email_address':  'email',
            'emailaddress':   'email',
            'e-mail':         'email',
            'e_mail':         'email',
            'mail':           'email',
        };

        function normalizeHeader(h) {
            // Strip UTF-8 BOM that Excel/CSV editors sometimes prepend to the first column
            const lower = h.replace(/^﻿/, '').trim().toLowerCase();
            return HEADER_ALIASES[lower] || lower.replace(/[\s\-]+/g, '_');
        }

        headers = headers.map(normalizeHeader);
        console.log('[CSV upload] normalized headers:', headers);
        rows = rows.map(row => {
            const normalized = {};
            Object.keys(row).forEach(k => { normalized[normalizeHeader(k)] = row[k]; });
            return normalized;
        });

        const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required column(s): ${missingColumns.join(', ')}. Expected: full_name, email`
            });
        }

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'File contains no data rows.' });
        }

        // --- SCRUM-17: Duplicate detection ---

        // Step 1: deduplicate within the file (keep first occurrence)
        const seenEmails = new Map();
        const uniqueRows = [];
        const duplicates = [];

        rows.forEach((row, i) => {
            const email = String(row.email || '').toLowerCase().trim();
            if (!email) {
                // No email at all — will be caught by missing-values check; preserve with row number
                uniqueRows.push({ ...row, _rowNum: i + 1 });
                return;
            }
            if (seenEmails.has(email)) {
                duplicates.push({ row: i + 1, email, reason: 'Duplicate within file' });
            } else {
                seenEmails.set(email, i + 1);
                uniqueRows.push({ ...row, _rowNum: i + 1 });
            }
        });

        // Step 2: check unique emails against the members table
        const emailsToCheck = uniqueRows
            .map(r => String(r.email || '').toLowerCase().trim())
            .filter(Boolean);

        if (emailsToCheck.length > 0) {
            const dbResult = await pool.query(
                'SELECT email FROM members WHERE email = ANY($1)',
                [emailsToCheck]
            );
            const existingEmails = new Set(dbResult.rows.map(r => r.email.toLowerCase()));

            for (let i = uniqueRows.length - 1; i >= 0; i--) {
                const email = String(uniqueRows[i].email || '').toLowerCase().trim();
                if (email && existingEmails.has(email)) {
                    duplicates.push({ row: uniqueRows[i]._rowNum, email, reason: 'Already exists in database' });
                    uniqueRows.splice(i, 1);
                }
            }
        }

        duplicates.sort((a, b) => a.row - b.row);

        // --- SCRUM-18: Missing values check (runs after dedup, on remaining rows) ---
        const missingRows = [];
        const validRows = [];

        uniqueRows.forEach(row => {
            const emptyFields = REQUIRED_COLUMNS.filter(
                col => !row[col] || String(row[col]).trim() === ''
            );
            if (emptyFields.length > 0) {
                missingRows.push({ row: row._rowNum, fields: emptyFields });
            } else {
                validRows.push(row);
            }
        });

        if (validRows.length === 0 && duplicates.length === 0 && missingRows.length === 0) {
            return res.status(400).json({ success: false, message: 'File contains no data rows.' });
        }

        if (validRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid rows to import — all rows were either duplicates or had missing required fields.',
                duplicateCount: duplicates.length,
                duplicates,
                missingCount: missingRows.length,
                missingRows
            });
        }

        // --- SCRUM-19: Data standardization ---
        function toTitleCase(str) {
            return str.trim().replace(/\S+/g, word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            );
        }

        const standardizedRows = validRows.map(row => {
            const s = {};
            // Trim every field first
            Object.keys(row).forEach(k => {
                s[k] = typeof row[k] === 'string' ? row[k].trim() : row[k];
            });
            // email → lowercase
            s.email = s.email.toLowerCase();
            // full_name → Title Case
            s.full_name = toTitleCase(s.full_name);
            // role → 'admin' (case-insensitive) or 'member' (default for everything else)
            if (s.role !== undefined) {
                s.role = String(s.role).toLowerCase().trim() === 'admin' ? 'admin' : 'member';
            }
            return s;
        });

        const parts = [`${standardizedRows.length} row(s) ready to import.`];
        if (duplicates.length > 0) parts.push(`${duplicates.length} duplicate(s) removed.`);
        if (missingRows.length > 0) parts.push(`${missingRows.length} row(s) skipped (missing data).`);

        return res.status(200).json({
            success: true,
            message: parts.join(' '),
            rowCount: standardizedRows.length,
            standardizedRows,
            duplicateCount: duplicates.length,
            duplicates,
            missingCount: missingRows.length,
            missingRows
        });

    } catch (err) {
        return res.status(400).json({ success: false, message: 'Could not parse file: ' + err.message });
    }
};

// --- SCRUM-20: Confirm import ---
const importMembers = async (req, res) => {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No rows to import.' });
    }

    const summary = { total: rows.length, inserted: [], skipped: [], failed: [] };

    for (const row of rows) {
        try {
            const tempPassword = crypto.randomBytes(8).toString('hex');
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const insertResult = await pool.query(
                `INSERT INTO members (full_name, email, role, password, created_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                [row.full_name, row.email, row.role || 'member', hashedPassword]
            );

            if (insertResult.rows.length === 0) {
                summary.skipped.push({ email: row.email, full_name: row.full_name, reason: 'Email already exists in database' });
                continue;
            }

            const memberId = insertResult.rows[0].id;
            summary.inserted.push({ email: row.email, full_name: row.full_name, role: row.role || 'member' });

            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
            const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

            await pool.query(
                `UPDATE members SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
                [hashedToken, expiresAt, memberId]
            );

            const resetLink = `${process.env.BASE_URL}/pages/MainPage/reset-password.html?token=${rawToken}`;

            transporter.sendMail({
                from: `"Organization X" <${process.env.SMTP_USER}>`,
                to: row.email,
                subject: 'Welcome to Organization X — Set your password',
                html: `
                    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:12px;">
                        <h2 style="color:#1a1a2e;margin-bottom:8px;">Welcome, ${row.full_name}!</h2>
                        <p style="color:#495057;margin-bottom:16px;">
                            Your account has been created for Organization X.<br>
                            Your login email is: <strong>${row.email}</strong>
                        </p>
                        <p style="color:#495057;margin-bottom:24px;">Click below to set your password and activate your account.</p>
                        <div style="text-align:center;margin-bottom:24px;">
                            <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:linear-gradient(175deg,#0f3460,#000000);color:#fff;text-decoration:none;border-radius:10px;font-family:monospace,Arial,sans-serif;font-size:14px;">
                                Set my password
                            </a>
                        </div>
                        <p style="color:#6c757d;font-size:13px;">This link expires in 72 hours. If you did not expect this email, please ignore it.</p>
                    </div>
                `
            }).catch(err => console.error(`Welcome email failed for ${row.email}:`, err.message));

        } catch (err) {
            console.error(`Import error for ${row.email}:`, err.message);
            summary.failed.push({ email: row.email, full_name: row.full_name, reason: err.message });
        }
    }

    const parts = [`Import complete. ${summary.inserted.length} inserted.`];
    if (summary.skipped.length > 0) parts.push(`${summary.skipped.length} skipped.`);
    if (summary.failed.length > 0) parts.push(`${summary.failed.length} failed.`);

    return res.status(200).json({ success: true, message: parts.join(' '), summary });
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
        const VALID_ROLES = ['member', 'admin', 'president', 'vice_president', 'secretary', 'treasurer', 'technical_lead'];
        const memberRole = VALID_ROLES.includes(role) ? role : 'member';

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
const updateMemberRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const VALID_ROLES = ['member', 'admin', 'president', 'vice_president', 'secretary', 'treasurer', 'technical_lead'];

    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Invalid role.' });
    }

    try {
        const result = await pool.query(
            'UPDATE members SET role = $1 WHERE id = $2 RETURNING id',
            [role, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Member not found.' });
        }
        return res.status(200).json({ message: 'Role updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerMember, loginMember, verifyLogin2FA, getMemberCount, updateProfile, getAllMembers, upload, uploadMembersCsv, importMembers, addMember, removeMember, updateMemberRole };