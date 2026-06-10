const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const crypto = require('crypto');
const bcrypt = require('bcrypt');
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

transporter.verify((error, success) => {
    if (error) {
        console.error('Transporter config error:', error);
    } else {
        console.log('Mail server is ready');
    }
});

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    try {
        const result = await pool.query(
            'SELECT id FROM members WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        // Always return 200 — never reveal if an email exists
        if (result.rows.length === 0) {
            return res.json({ message: 'If that email is registered, a reset link has been sent.' });
        }

        const userId = result.rows[0].id;

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            `UPDATE members
         SET reset_token = $1, reset_token_expires = $2
       WHERE id = $3`,
            [hashedToken, expiresAt, userId]
        );

        const resetLink = `${process.env.BASE_URL}/pages/reset-password.html?token=${rawToken}`;
        await transporter.sendMail({
            from: `"Your App" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset your password',
            html: `
    <p>Hi,</p>
    <p>We received a request to reset your password.</p>
    <p>
      <a href="${resetLink}" style="
        display:inline-block; padding:12px 24px;
        background:#1a1a1a; color:#fff;
        text-decoration:none; border-radius:4px;
        font-family:Arial,sans-serif;
      ">Reset my password</a>
    </p>
    <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  `,
        });

        res.json({ message: 'If that email is registered, a reset link has been sent.' });

    } catch (err) {
        console.error('forgotPassword error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required.' });
    }
    if (password.length < 8) {
        return res.status(422).json({ error: 'Password must be at least 8 characters.' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const result = await pool.query(
            `SELECT id FROM members
       WHERE reset_token = $1
         AND reset_token_expires > NOW()`,
            [hashedToken]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
        }

        const userId = result.rows[0].id;
        const hashedPassword = await bcrypt.hash(password, 12);

        await pool.query(
            `UPDATE members
         SET password       = $1,
             reset_token         = NULL,
             reset_token_expires = NULL
       WHERE id = $2`,
            [hashedPassword, userId]
        );

        res.json({ message: 'Password updated successfully.' });

    } catch (err) {
        console.error('resetPassword error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
};

module.exports = { forgotPassword, resetPassword };
