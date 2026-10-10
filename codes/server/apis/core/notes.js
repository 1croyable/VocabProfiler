const express = require('express');
const router = express.Router();
const connection = require('../../db/connection');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

const database = 'vocab_profiler_db';
const validId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;

const { createNote, addNoteWord, validWord, cleanWord, wordKey } = require('../../utilities/noteWordManager');

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
        const note = await createNote(connection.execute.bind(connection), req.user.id, suppliedName);
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// External JSON array: [{ front, back, type: 'active' | 'passive' }].
router.post('/import', async (req, res) => {
    const source = req.body?.source;
    const inputWords = req.body?.words;

    if (!Array.isArray(inputWords) || !inputWords.length || inputWords.length > 1000)
        return res.status(400).json({ error: 'Expected 1–1000 words' });

    if (source !== undefined && typeof source !== 'string')
        return res.status(400).json({ error: 'Source must be a string' });

    const words = inputWords.map(item => ({ word: item.front, explanation: item.back, type: item.type }));

    const invalidIndex = words.findIndex(item => !validWord(item));

    if (invalidIndex !== -1)
        return res.status(400).json({ error: 'Invalid front, back or type', index: invalidIndex });

    const unique = new Map(words.map(item => [wordKey(item), cleanWord(item)]));

    const timestamp = new Date().toLocaleString('sv-SE');
    const name = source?.trim()
        ? `${source.trim()} - ${timestamp}`
        : timestamp;

    try {
        const note = await connection.transaction(database, async execute => {
            const created = await createNote(execute, req.user.id, name);
            for (const item of unique.values()) {
                await addNoteWord(execute, req.user.id, created.id, item);
                created.word_count++;

                if (item.type === 'active')
                    created.active_count++;

                else created.passive_count++;
            }
            return created;
        });
        res.status(201).json({ ...note, skipped: words.length - unique.size });
    } catch (error) {
        res.status(500).json({ error: 'Failed to import note' });
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
    try {
        const result = await addNoteWord(connection.execute.bind(connection), req.user.id, req.params.id, req.body);

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
    const { notebook_id, words } = req.body;

    if (!validId(req.params.id) || !validId(notebook_id) || !Array.isArray(words) ||
        !words.length || words.length > 1000 || !words.every(validWord)) {
        return res.status(400).json({ error: 'Invalid note, notebook ID or reviewed words' });
    }

    const inputs = words.map(cleanWord);

    if (new Set(inputs.map(wordKey)).size !== inputs.length)
        return res.status(409).json({ error: 'Identical words exist in the selected batch' });

    try {
        const added = await connection.transaction(database, async execute => {
            const targets = await execute(database, `
                SELECT nb.id FROM notebooks nb
                JOIN notes n ON n.user_id = nb.user_id
                WHERE nb.id = ? AND n.id = ? AND nb.user_id = ? FOR UPDATE
            `, [notebook_id, req.params.id, req.user.id]);

            if (!targets.length)
                throw new Error('Note or notebook not found');

            const existing = await execute(database,
                'SELECT word, explanation, type FROM words WHERE notebook_id = ? AND user_id = ?',
                [notebook_id, req.user.id]);

            const keys = new Set(existing.map(wordKey));

            if (inputs.some(item => keys.has(wordKey(item))))
                throw new Error('Identical words already exist; review the conflicts again');

            const placeholders = inputs.map(() => '(?, ?, ?, ?, ?)').join(', ');

            const result = await execute(database,
                `INSERT INTO words (user_id, notebook_id, word, explanation, type) VALUES ${placeholders}`,
                inputs.flatMap(item => [req.user.id, notebook_id, item.word, item.explanation, item.type]));

            return result.affectedRows;
        });

        res.json({ added });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to apply note to notebook' });
    }
});

module.exports = router;
