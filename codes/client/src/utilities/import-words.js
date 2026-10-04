export const normalizeText = value => (value ?? '').replace(/\r\n/g, '\n').trim().toLowerCase();

export const sameFront = (a, b) => a.type === b.type && normalizeText(a.word) === normalizeText(b.word);

export const sameWord = (a, b) => sameFront(a, b) && normalizeText(a.explanation) === normalizeText(b.explanation);

export const validImportWord = item => item && typeof item.word === 'string' &&
    item.word.trim().length > 0 && item.word.trim().length <= 255 &&
    typeof item.explanation === 'string' && item.explanation.trim().length > 0 &&
    ['active', 'passive'].includes(item.type);