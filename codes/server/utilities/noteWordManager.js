const database = 'vocab_profiler_db';

const normalizeText = value => value.replace(/\r\n/g, '\n').trim().toLowerCase();

const wordKey = item => JSON.stringify([item.type, normalizeText(item.word), normalizeText(item.explanation)]);

const validWord = item => item && typeof item.word === 'string' &&
    item.word.trim().length > 0 && item.word.trim().length <= 255 &&
    typeof item.explanation === 'string' && item.explanation.trim().length > 0 &&
    ['active', 'passive'].includes(item.type);

const cleanWord = item => ({ 
    word: item.word.replace(/\r\n/g, '\n').trim(),
    explanation: item.explanation.replace(/\r\n/g, '\n').trim(),
    type: item.type
});

async function createNote(execute, userId, suppliedName) {
    const name = suppliedName?.trim() || new Date().toLocaleString('sv-SE');

    const result = await execute(database, 'INSERT INTO notes (user_id, name) VALUES (?, ?)', [userId, name]);

    return { id: result.insertId, name, word_count: 0, active_count: 0, passive_count: 0 };
}

async function addNoteWord(execute, userId, noteId, input) {
    const { word, explanation, type } = cleanWord(input);

    return execute(database, `
        INSERT INTO note_words (note_id, word, explanation, type)
        SELECT n.id, ?, ?, ? FROM notes n
        WHERE n.id = ? AND n.user_id = ?
          AND NOT EXISTS (
              SELECT 1 FROM note_words nw WHERE nw.note_id = n.id
                AND BINARY nw.word = BINARY ? AND BINARY nw.explanation = BINARY ? AND nw.type = ?
          )
    `, [word, explanation, type, noteId, userId, word, explanation, type]);
}

module.exports = { createNote, addNoteWord, validWord, cleanWord, wordKey };
