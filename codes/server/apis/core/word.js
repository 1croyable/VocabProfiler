const express = require('express');
const router = express.Router();
const connection = require('../../db/connection');

router.get('/list', async (req, res) => {
    const group = req.query.group;

    let result;
    const sql = `
        SELECT id, word, explanation, type, level,
        DATE_FORMAT(next_review_date, '%Y-%m-%d') as next_review_date, 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        word_group
        FROM words WHERE word_group = ?
    `;
    try{
        result = await connection.execute('vocab_profiler_db', sql, [group]);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch words' });
    }

    res.json(result);
});

router.post('/add', async (req, res) => {
    const { word, explanation, type, word_group } = req.body;

    try {
        await connection.execute('vocab_profiler_db', 'INSERT INTO words (word, explanation, type, word_group) VALUES (?, ?, ?, ?)', [word, explanation, type, word_group]);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to add word' });
    }

    // 获取最新插入的id
    const newIdResult = await connection.execute('vocab_profiler_db', 'SELECT LAST_INSERT_ID() as id');
    const newId = newIdResult[0].id;
    res.json(newId);
});

router.patch('/update-level', async (req, res) => {
    const { id, word, level, next_review_date } = req.body;

    try {
        await connection.execute('vocab_profiler_db', 'UPDATE words SET level = ?, next_review_date = ? WHERE id = ? AND word = ?', [level, next_review_date, id, word]);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update word level'  });
    }

    res.json({ message: 'Word level updated successfully' });
})

module.exports = router;