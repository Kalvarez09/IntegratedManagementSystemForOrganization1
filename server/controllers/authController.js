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

module.exports = { registerMember, loginMember, getMemberCount };