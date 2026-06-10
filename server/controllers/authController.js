const pool = require('../database/database');
const bcrypt = require('bcrypt');

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

const updateProfile = async (req, res) => {
    const { userId, full_name, email, currentPassword, newPassword, updateType } = req.body;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    try {
        const result = await pool.query('SELECT * FROM members WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const member = result.rows[0];

        if (updateType === 'name') {
            if (!full_name) return res.status(400).json({ message: 'Full name is required' });
            await pool.query('UPDATE members SET full_name = $1 WHERE id = $2', [full_name, userId]);
            return res.status(200).json({ message: 'Name updated successfully' });
        }

        if (updateType === 'email') {
            if (!email) return res.status(400).json({ message: 'Email is required' });
            const existing = await pool.query('SELECT id FROM members WHERE email = $1 AND id != $2', [email, userId]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ message: 'Email already in use by another account' });
            }
            await pool.query('UPDATE members SET email = $1 WHERE id = $2', [email, userId]);
            return res.status(200).json({ message: 'Email updated successfully' });
        }

        if (updateType === 'password') {
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Current and new password are required' });
            }
            const passwordMatch = await bcrypt.compare(currentPassword, member.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            const hashed = await bcrypt.hash(newPassword, 10);
            await pool.query('UPDATE members SET password = $1 WHERE id = $2', [hashed, userId]);
            return res.status(200).json({ message: 'Password updated successfully' });
        }

        return res.status(400).json({ message: 'Invalid update type' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerMember, loginMember, getMemberCount, updateProfile };