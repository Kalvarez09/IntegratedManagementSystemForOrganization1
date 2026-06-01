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

module.exports = { registerMember };