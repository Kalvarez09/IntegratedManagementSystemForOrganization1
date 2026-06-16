const pool = require('../database/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { Readable } = require('stream');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const crypto = require('crypto');


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

        // SCRUM-82: create session
        const role = member.role || 'member';

        req.session.memberId = member.id;
        req.session.memberName = member.full_name;
        req.session.memberEmail = member.email;
        req.session.memberRole = role;

        res.status(200).json({
            message: 'Login successful',
            member: {
                id: member.id,
                full_name: member.full_name,
                email: member.email,
                role: role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
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

        // rest of your existing validation logic stays exactly the same
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

module.exports = { registerMember, loginMember, getMemberCount, updateProfile, getAllMembers, upload, uploadMembersCsv, addMember, removeMember  };
