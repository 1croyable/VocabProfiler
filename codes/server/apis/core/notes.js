const express = require('express');
const router = express.Router();
const connection = require('../../db/connection');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

const database = 'vocab_profiler_db';
const validId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const validWord = item =>
    item && typeof item.word === 'string' && item.word.trim().length > 0 && item.word.trim().length <= 255 &&
    typeof item.explanation === 'string' && item.explanation.trim().length > 0 &&
    ['active', 'passive'].includes(item.type);

router.get('/', async (req, res) => {
    try {
        const notes = await connection.execute(database, `
            SELECT n.id, n.name, DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                DATE_FORMAT(n.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
                COUNT(nw.id) AS word_count,
                SUM(CASE WHEN nw.type = 'active' THEN 1 ELSE 0 END) AS active_count,
                SUM(CASE WHEN nw.type = 'passive' THEN 1 ELSE 0 END) AS passive_count
            FROM notes n
            LEFT JOIN note_words nw ON nw.note_id = n.id
            WHERE n.user_id = ?
            GROUP BY n.id
            ORDER BY n.id ASC
        `, [req.user.id]);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load notes' });
    }
});

router.post('/', async (req, res) => {
    const suppliedName = req.body.name;
    if (suppliedName !== undefined && (typeof suppliedName !== 'string' || !suppliedName.trim() || suppliedName.trim().length > 64))
        return res.status(400).json({ error: 'Note name must be 1–64 characters' });

    try {
        const name = suppliedName?.trim() || new Date().toLocaleString('sv-SE');
        const result = await connection.execute(database, 'INSERT INTO notes (user_id, name) VALUES (?, ?)', [req.user.id, name]);
        res.status(201).json({ id: result.insertId, name, word_count: 0, active_count: 0, passive_count: 0 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create note' });
    }
});

router.get('/:id/words', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid note ID' });
    try {
        const notes = await connection.execute(database, 'SELECT id FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!notes.length)
            return res.status(404).json({ error: 'Note not found' });

        const words = await connection.execute(database, `
            SELECT nw.id, nw.note_id, nw.word, nw.explanation, nw.type,
                DATE_FORMAT(nw.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
            FROM note_words nw
            JOIN notes n ON n.id = nw.note_id
            WHERE nw.note_id = ? AND n.user_id = ?
            ORDER BY nw.id ASC
        `, [req.params.id, req.user.id]);
        res.json(words);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load note words' });
    }
});

router.patch('/:id', async (req, res) => {
    const name = req.body.name;
    if (!validId(req.params.id) || typeof name !== 'string' || !name.trim() || name.trim().length > 64)
        return res.status(400).json({ error: 'Invalid note name or ID' });
    try {
        const result = await connection.execute(database, 'UPDATE notes SET name = ? WHERE id = ? AND user_id = ?', [name.trim(), req.params.id, req.user.id]);

        if (!result.affectedRows)
            return res.status(404).json({ error: 'Note not found' });

        res.json({ name: name.trim() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to rename note' });
    }
});

router.delete('/:id', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid note ID' });
    try {
        const result = await connection.execute(database, 'DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!result.affectedRows)
            return res.status(404).json({ error: 'Note not found' });
        
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

router.post('/:id/words', async (req, res) => {
    if (!validId(req.params.id) || !validWord(req.body)) return res.status(400).json({ error: 'Invalid word or note ID' });
    const { word, explanation, type } = req.body;
    try {
        const result = await connection.execute(database, `
            INSERT INTO note_words (note_id, word, explanation, type)
            SELECT n.id, ?, ?, ? FROM notes n
            WHERE n.id = ? AND n.user_id = ?
              AND NOT EXISTS (
                  SELECT 1 FROM note_words nw WHERE nw.note_id = n.id
                    AND BINARY nw.word = BINARY ? AND BINARY nw.explanation = BINARY ? AND nw.type = ?
              )
        `, [word.trim(), explanation.trim(), type, req.params.id, req.user.id, word.trim(), explanation.trim(), type]);

        if (!result.affectedRows)
            return res.status(409).json({ error: 'Note not found or word already exists' });

        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add note word' });
    }
});

router.patch('/:id/words/:wordId', async (req, res) => {
    if (!validId(req.params.id) || !validId(req.params.wordId) || !validWord(req.body))
        return res.status(400).json({ error: 'Invalid word or note ID' });
    const { word, explanation, type } = req.body;
    try {
        const duplicate = await connection.execute(database, `
            SELECT nw.id FROM note_words nw JOIN notes n ON n.id = nw.note_id
            WHERE n.id = ? AND n.user_id = ? AND nw.id <> ?
              AND BINARY nw.word = BINARY ? AND BINARY nw.explanation = BINARY ? AND nw.type = ?
        `, [req.params.id, req.user.id, req.params.wordId, word.trim(), explanation.trim(), type]);

        if (duplicate.length)
            return res.status(409).json({ error: 'Word already exists in this note' });

        const result = await connection.execute(database, `
            UPDATE note_words nw JOIN notes n ON n.id = nw.note_id
            SET nw.word = ?, nw.explanation = ?, nw.type = ?
            WHERE nw.id = ? AND n.id = ? AND n.user_id = ?
        `, [word.trim(), explanation.trim(), type, req.params.wordId, req.params.id, req.user.id]);

        if (!result.affectedRows)
            return res.status(404).json({ error: 'Note word not found' });

        res.json({ message: 'Note word updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update note word' });
    }
});

router.delete('/:id/words/:wordId', async (req, res) => {
    if (!validId(req.params.id) || !validId(req.params.wordId)) return res.status(400).json({ error: 'Invalid word or note ID' });
    try {
        const result = await connection.execute(database, `
            DELETE nw FROM note_words nw JOIN notes n ON n.id = nw.note_id
            WHERE nw.id = ? AND n.id = ? AND n.user_id = ?
        `, [req.params.wordId, req.params.id, req.user.id]);

        if (!result.affectedRows)
            return res.status(404).json({ error: 'Note word not found' });

        res.json({ message: 'Note word deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note word' });
    }
});

router.post('/:id/apply', async (req, res) => {
    if (!validId(req.params.id) || !validId(req.body.notebook_id))
        return res.status(400).json({ error: 'Invalid note or notebook ID' });
    try {
        const targets = await connection.execute(database, `
            SELECT n.id FROM notes n JOIN notebooks nb ON nb.id = ? AND nb.user_id = n.user_id
            WHERE n.id = ? AND n.user_id = ?
        `, [req.body.notebook_id, req.params.id, req.user.id]);

        if (!targets.length)
            return res.status(404).json({ error: 'Note or notebook not found' });

        const result = await connection.execute(database, `
            INSERT INTO words (user_id, notebook_id, word, explanation, type)
            SELECT n.user_id, nb.id, nw.word, nw.explanation, nw.type
            FROM note_words nw
            JOIN notes n ON n.id = nw.note_id AND n.user_id = ?
            JOIN notebooks nb ON nb.id = ? AND nb.user_id = n.user_id
            WHERE n.id = ? AND NOT EXISTS (
                SELECT 1 FROM words w WHERE w.notebook_id = nb.id AND w.user_id = n.user_id
                  AND BINARY w.word = BINARY nw.word AND BINARY w.explanation = BINARY nw.explanation AND w.type = nw.type
            )
        `, [req.user.id, req.body.notebook_id, req.params.id]);

        res.json({ added: result.affectedRows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to apply note to notebook' });
    }
});

module.exports = router;
