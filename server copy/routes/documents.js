// server/routes/documents.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../database/database');

// ─── Upload storage config ────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, unique + path.extname(file.originalname));
    }
});

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg'
];

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Allowed: PDF, DOCX, XLSX, PNG, JPG.'));
    }
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    if (!req.session?.memberId) return res.status(401).json({ error: 'Not authenticated.' });
    next();
}

function requireAdmin(req, res, next) {
    if (req.session?.memberRole !== 'admin') return res.status(403).json({ error: 'Admins only.' });
    next();
}

// ─── GET /api/documents — list all accessible documents ──────────────────────
router.get('/', requireAuth, async (req, res) => {
    const user = req.session.user;
    try {
        let query, params;

        if (req.session.memberRole === 'admin') {
            // Admins see everything
            query = `SELECT d.*, m.full_name AS uploader_name
                      FROM documents d
                      LEFT JOIN members m ON d.uploaded_by = m.id
                      ORDER BY d.uploaded_at DESC`;
            params = [];
        } else {
            // Members only see documents marked for members
            query = `SELECT d.*, m.full_name AS uploader_name
                      FROM documents d
                      LEFT JOIN members m ON d.uploaded_by = m.id
                      WHERE d.access = 'members'
                      ORDER BY d.uploaded_at DESC`;
            params = [];
        }

        const result = await pool.query(query, params);
        res.json({ documents: result.rows });
    } catch (err) {
        console.error('GET /api/documents error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ─── POST /api/documents/upload — admin uploads a document ───────────────────
router.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const { title, category = 'Uncategorized', access = 'members' } = req.body;
    if (!title) return res.status(400).json({ error: 'Document title is required.' });

    try {
        await pool.query(
            `INSERT INTO documents (title, filename, filepath, category, access, uploaded_by, uploaded_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [title, req.file.originalname, req.file.filename, category, access, req.session.memberID]
        );
        res.json({ message: 'Document uploaded successfully.' });
    } catch (err) {
        // Clean up uploaded file on DB error
        fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => { });
        console.error('POST /api/documents/upload error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ─── GET /api/documents/download/:id — download a file ───────────────────────
router.get('/download/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM documents WHERE id = $1', [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found.' });

        const doc = result.rows[0];

        // Members cannot download admin-only documents
        if (req.session.memberRole !== 'admin' && doc.access === 'admin') {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const filePath = path.join(UPLOAD_DIR, doc.filepath);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server.' });

        res.download(filePath, doc.filename);

        console.log('Looking for file at:', filePath);
        console.log('File exists: ', fs.existsSync(filePath));
    } catch (err) {
        console.error('GET /api/documents/download error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ─── DELETE /api/documents/:id — admin deletes a document ────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM documents WHERE id = $1', [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found.' });

        const doc = result.rows[0];

        // Delete from DB first
        await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);

        // Then delete the file from disk
        const filePath = path.join(UPLOAD_DIR, doc.filepath);
        if (fs.existsSync(filePath)) fs.unlink(filePath, () => { });

        res.json({ message: 'Document deleted successfully.' });
    } catch (err) {
        console.error('DELETE /api/documents error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
