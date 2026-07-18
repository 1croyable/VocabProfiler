const express = require('express');
const router = express.Router();
const connection = require('../../db/connection');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/list', async (req, res) => {
    const userId = req.query.userId;

    let result;
    const sql = `
        SELECT id, word, explanation, type, level,
        DATE_FORMAT(next_review_date, '%Y-%m-%d') as next_review_date, 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        word_group
        FROM words WHERE user_id = ?
    `;
    try{
        result = await connection.execute('vocab_profiler_db', sql, [userId]);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch words' });
    }

    res.json(result);
});

router.post('/add', async (req, res) => {
    const { word, explanation, type, word_group, user_id } = req.body;

    try {
        await connection.execute('vocab_profiler_db', 'INSERT INTO words (word, explanation, type, word_group, user_id) VALUES (?, ?, ?, ?, ?)', [word, explanation, type, word_group, user_id]);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to add word' });
    }

    const newIdResult = await connection.execute('vocab_profiler_db', 'SELECT LAST_INSERT_ID() as id');
    const newId = newIdResult[0].id;
    res.json(newId);
});

router.post('/add-batch', authMiddleware, async (req, res) => {
    const { words } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(words) || words.length === 0) {
        return res.status(400).json({
            error: 'words must be a non-empty array'
        });
    }

    const normalizedWords = [];

    for (let index = 0; index < words.length; index++) {
        const item = words[index];

        normalizedWords.push({
            word: item.word.trim(),
            explanation: item.explanation.trim(),
            type: item.type,
            word_group: 1
        });
    }

    const placeholders = normalizedWords.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const sql = `INSERT INTO words ( word, explanation, type, word_group, user_id ) VALUES ${placeholders}`;
    
    const values = normalizedWords.flatMap(item => [item.word, item.explanation, item.type, item.word_group, userId]);
    
    try {
        const result = await connection.execute('vocab_profiler_db', sql, values);

        return res.status(201).json({message: 'Words added successfully',});
    } catch (error) {
        console.error('Failed to add words in batch:', error);

        return res.status(500).json({error: 'Failed to add words'});
    }
});

router.patch('/update-level', async (req, res) => {
    const { id, word, level, next_review_date, user_id } = req.body;

    try {
        await connection.execute('vocab_profiler_db', 'UPDATE words SET level = ?, next_review_date = ? WHERE id = ? AND word = ? AND user_id = ?', [level, next_review_date, id, word, user_id]);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update word level'  });
    }

    res.json({ message: 'Word level updated successfully' });
})

router.patch('/update', authMiddleware, async (req, res) => {
    const { id, word, explanation, type } = req.body;
    const userId = req.user.id;

    if (!id || !word || !explanation || !type) {
        return res.status(400).json({ error: 'id, word, explanation and type are required' });
    }

    try {
        const result = await connection.execute(
            'vocab_profiler_db',
            'UPDATE words SET word = ?, explanation = ?, type = ? WHERE id = ? AND user_id = ?',
            [word, explanation, type, id, userId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ error: 'Word not found' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update word' });
    }

    res.json({ message: 'Word updated successfully' });
});

router.delete('/remove/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
        return res.status(400).json({ error: 'id is required' });
    }

    try {
        const result = await connection.execute(
            'vocab_profiler_db',
            'DELETE FROM words WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ error: 'Word not found' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Failed to remove word' });
    }

    res.json({ message: 'Word removed successfully' });
});

module.exports = router;