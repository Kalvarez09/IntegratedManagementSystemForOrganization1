// server/routes/financial.js
// npm install pdfkit (for PDF reports)

const express = require('express');
const router  = express.Router();
const pool    = require('../database/database'); // adjust if your path differs

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
    if (req.session?.memberRole !== 'admin') {
        return res.status(403).json({ error: 'Admins only.' });
    }
    next();
}

// ─── GET /api/financial — list all transactions ───────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM financial_transactions ORDER BY date DESC, created_at DESC`
        );
        res.json({ transactions: result.rows });
    } catch (err) {
        console.error('GET /api/financial error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ─── POST /api/financial — add a transaction ──────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
    const { type, amount, date, category, description } = req.body;

    // Validation
    if (!type || !['income', 'expenditure'].includes(type)) {
        return res.status(400).json({ error: 'Type must be income or expenditure.' });
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number.' });
    }
    if (!date) {
        return res.status(400).json({ error: 'Date is required.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO financial_transactions (type, amount, date, category, description, recorded_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING *`,
            [type, parseFloat(amount), date, category || 'Other', description || '', req.session.memberId]
        );
        res.status(201).json({
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction saved.`,
            transaction: result.rows[0]
        });
    } catch (err) {
        console.error('POST /api/financial error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ─── DELETE /api/financial/:id — delete a transaction ────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM financial_transactions WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }
        res.json({ message: 'Transaction deleted successfully.' });
    } catch (err) {
        console.error('DELETE /api/financial error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ─── GET /api/financial/report — generate CSV or PDF report (SCRUM-61) ────────
router.get('/report', requireAdmin, async (req, res) => {
    const { from, to, format = 'csv' } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: 'From and to dates are required.' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM financial_transactions
             WHERE date >= $1 AND date <= $2
             ORDER BY date ASC`,
            [from, to]
        );
        const txns = result.rows;

        // ── CSV ──────────────────────────────────────────────────────────────
        if (format === 'csv') {
            const lines = [
                'Type,Description,Category,Amount,Date',
                ...txns.map(t =>
                    `${t.type},"${(t.description||'').replace(/"/g,'""')}",${t.category},${parseFloat(t.amount).toFixed(2)},${new Date(t.date).toLocaleDateString()}`
                )
            ];

            // Totals
            const income      = txns.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
            const expenditure = txns.filter(t => t.type === 'expenditure').reduce((s, t) => s + parseFloat(t.amount), 0);
            lines.push('');
            lines.push(`Total Income,,,£${income.toFixed(2)},`);
            lines.push(`Total Expenditure,,,£${expenditure.toFixed(2)},`);
            lines.push(`Net Balance,,,£${(income - expenditure).toFixed(2)},`);

            const csv = lines.join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="financial-report-${from}-to-${to}.csv"`);
            return res.send(csv);
        }

        // ── PDF ──────────────────────────────────────────────────────────────
        if (format === 'pdf') {
            let PDFDocument;
            try { PDFDocument = require('pdfkit'); }
            catch {
                return res.status(500).json({ error: 'PDF generation not available. Install pdfkit: npm install pdfkit' });
            }

            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="financial-report-${from}-to-${to}.pdf"`);
            doc.pipe(res);

            // Title
            doc.fontSize(20).font('Helvetica-Bold').text('Organization X', { align: 'center' });
            doc.fontSize(14).font('Helvetica').text('Financial Report', { align: 'center' });
            doc.fontSize(11).text(`Period: ${from} to ${to}`, { align: 'center' });
            doc.moveDown(1.5);

            // Totals
            const income      = txns.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
            const expenditure = txns.filter(t => t.type === 'expenditure').reduce((s, t) => s + parseFloat(t.amount), 0);
            const balance     = income - expenditure;

            doc.font('Helvetica-Bold').fontSize(12).text('Summary');
            doc.font('Helvetica').fontSize(11);
            doc.text(`Total Income:       £${income.toFixed(2)}`);
            doc.text(`Total Expenditure:  £${expenditure.toFixed(2)}`);
            doc.text(`Net Balance:        £${balance.toFixed(2)}`);
            doc.moveDown(1.5);

            // Table header
            doc.font('Helvetica-Bold').fontSize(11).text('Transactions');
            doc.moveDown(0.5);

            if (txns.length === 0) {
                doc.font('Helvetica').fontSize(10).text('No transactions in this period.');
            } else {
                txns.forEach(t => {
                    const sign = t.type === 'income' ? '+' : '-';
                    doc.font('Helvetica').fontSize(10)
                        .text(`${new Date(t.date).toLocaleDateString()}  ${sign}£${parseFloat(t.amount).toFixed(2)}  [${t.type}]  ${t.category}  ${t.description || ''}`);
                });
            }

            doc.end();
            return;
        }

        res.status(400).json({ error: 'Invalid format. Use csv or pdf.' });

    } catch (err) {
        console.error('GET /api/financial/report error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
