const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const WordpackModel = require('../models/wordpackModel');

const WORDPACKS_DIR = path.join(__dirname, '../wordpacks');

async function createWordPack(name, author, words) {
    const clearedName = name.trim().toLowerCase().replace(/\s+/g, ' ');
    const now = new Date().toISOString();
    const id = generateHashId(clearedName);
    const wordpackData = new WordpackModel({
        id,
        "name": clearedName,
        "author": author,
        "createdAt": now,
        "updatedAt": now,
        words
    });

    await saveWordpackToFile(wordpackData);
    return id;
}

function generateHashId(name) {
    return crypto.createHash('sha256').update(name, 'utf8').digest('hex').slice(0, 16);
}

async function saveWordpackToFile(wordpackData) {
    await fs.mkdir(WORDPACKS_DIR, { recursive: true });
    const filePath = path.join(WORDPACKS_DIR, `${wordpackData.id}.json`);

    await fs.writeFile(filePath, JSON.stringify(wordpackData, null, 2), {
        "encoding": "utf8",
        "flag": "wx"
    });

    return;
}

module.exports = { createWordPack };