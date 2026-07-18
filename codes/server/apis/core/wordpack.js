const express = require('express');
const router = express.Router();
const WordpackModel = require('../../models/wordpackModel');
const crypto = require('crypto');
const authMiddleware = require('../../middlewares/authMiddleware');
const { createWordPack } = require('../../utilities/wordpackManager');
const fs = require('fs/promises');
const path = require('path');

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { name, words } = req.body;

        if (!name || !words || Array.isArray(words) === false) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const author = Number(req.user.id);
        const id = await createWordPack(name, author, words);

        res.status(201).json({ message: 'Wordpack created successfully', id });
    }
    catch (error) {
        if (error.code === 'EEXIST')
            return res.status(409).json({ error: 'A word pack with the same name already exists' });

        if (error.message.startsWith('Invalid') || error.message.startsWith('Missing'))
            return res.status(400).json({ error: error.message });

        console.error('Error creating wordpack:', error);

        return res.status(500).json({ error: 'Failed to create wordpack' });
    }
});

router.post('/noAuth-create', async (req, res) => {
    try {
        const { name, words } = req.body;

        if (!name || !words || Array.isArray(words) === false) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const id = await createWordPack(name, 0, words);

        res.status(201).json({ message: 'Wordpack created successfully', id });
    }
    catch (error) {
        if (error.code === 'EEXIST')
            return res.status(409).json({ error: 'A word pack with the same name already exists' });

        if (error.message.startsWith('Invalid') || error.message.startsWith('Missing'))
            return res.status(400).json({ error: error.message });

        console.error('Error creating wordpack:', error);

        return res.status(500).json({ error: 'Failed to create wordpack' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const filePath = path.join(__dirname, '../../wordpacks', `${id}.json`);

        const fileContent = await fs.readFile(filePath, 'utf8');

        const wordPackData = WordpackModel.fromJSONText(fileContent);

        res.status(200).json(wordPackData);
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return res.status(404).json({ error: 'Wordpack not found' });

        console.error('Failed to read word pack:', error);

        return res.status(500).json({ error: 'Failed to read word pack' });
    }
});

module.exports = router;