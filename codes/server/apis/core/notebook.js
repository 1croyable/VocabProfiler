const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const connection = require('../../db/connection');

router.post('/word-number', authMiddleware, async (req, res) => {
    const { notebook_ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(notebook_ids) || notebook_ids.length === 0) {
        return res.status(400).json({
            error: 'notebook_ids must be a non-empty array'
        });
    }

    const placeholders = notebook_ids.map(() => '?').join(', ');

    const sql = `
        SELECT notebooks.id AS notebook_id, COUNT(words.id) AS word_count
        FROM notebooks
        LEFT JOIN words
            ON words.notebook_id = notebooks.id
            AND words.user_id = ?
        WHERE notebooks.user_id = ?
            AND notebooks.id IN (${placeholders})
        GROUP BY notebooks.id
    `;

    try {
        const result = await connection.execute('vocab_profiler_db', sql, [userId, userId, ...notebook_ids]);

        res.status(200).json(result);
    } catch (error) {
        console.error('Failed to fetch word number:', error);
        res.status(500).json({ error: 'Failed to fetch word number' });
    }
});

router.post('/create', authMiddleware, async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;

    const sql = 'INSERT INTO notebooks (name, user_id) VALUES (?, ?)';
    try {
        const result = await connection.execute('vocab_profiler_db', sql, [name, userId]);
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error('Failed to create notebook:', error);
        res.status(500).json({ error: 'Failed to create notebook' });
    }
});

router.delete('/remove/:id', authMiddleware, async (req, res) => {
    const notebookId = req.params.id;
    const userId = req.user.id;

    const sql = `
        DELETE target
        FROM notebooks AS target
        JOIN notebooks AS other
            ON other.user_id = target.user_id
            AND other.id <> target.id
        WHERE target.id = ? AND target.user_id = ?
    `;

    try {
        const result = await connection.execute('vocab_profiler_db', sql, [notebookId, userId]);

        if (result.affectedRows === 0)
            return res.status(400).json({error: 'Notebook cannot be deleted'});

        return res.status(200).json({message: 'Notebook deleted successfully'});
    } catch (error) {
        console.error('Failed to delete notebook:', error);
        return res.status(500).json({
            error: 'Failed to delete notebook'
        });
    }
});

router.patch('/changeName', authMiddleware, async (req, res) => {
    const { id, name: newName } = req.body;
    const userId = req.user.id;

    const sql = "UPDATE notebooks SET name = ? WHERE id = ? AND user_id = ?";

    try {
        const result = await connection.execute('vocab_profiler_db', sql, [newName, id, userId]);
    } catch (error) {
        console.error('Failed to change notebook name:', error);
        return res.status(500).json({error: 'Failed to change notebook name'});
    }

    res.json({ message: 'Notebook name changed successfully' });
});

module.exports = router;