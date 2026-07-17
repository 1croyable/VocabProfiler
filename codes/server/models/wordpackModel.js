/**
 * 单词包的数据结构，添加词汇的时候需要用户自行制定word group并在http请求中自动解析出user id
    {
        "id": string 不可空 表示标识符，使用name的哈希编码,
        "name": string 不可空, 
        "author": int 不可空 表示数据库里的用户ID，如果是0表示脚本生成的包,
        "createdAt": string 不可空 表示创建时间,
        "updatedAt": string 不可空 表示更新时间,
        "words": [
            {
                "word": string 不可空 表示正面,
                "explanation": string 不可空 表示反面,
                "type": 'active' | 'passive' 不可空 表示单词类型,
            }
        ]
    }
 */

class WordpackModel {
    constructor(data) {
        if (
            data == null ||
            typeof data !== 'object' ||
            Array.isArray(data)
        ) {
            throw new Error('Invalid data provided to WordpackModel');
        }

        if (
            typeof data.id !== 'string' ||
            data.id.trim().length === 0
        ) {
            throw new Error('Invalid or missing id in WordpackModel data');
        }

        if (
            typeof data.name !== 'string' ||
            data.name.trim().length === 0
        ) {
            throw new Error('Invalid or missing name in WordpackModel data');
        }

        if (!Number.isInteger(data.author) || data.author < 0) {
            throw new Error('Invalid or missing author in WordpackModel data');
        }

        if (
            typeof data.createdAt !== 'string' ||
            Number.isNaN(Date.parse(data.createdAt))
        ) {
            throw new Error('Invalid or missing createdAt in WordpackModel data');
        }

        if (
            typeof data.updatedAt !== 'string' ||
            Number.isNaN(Date.parse(data.updatedAt))
        ) {
            throw new Error('Invalid or missing updatedAt in WordpackModel data');
        }

        if (!Array.isArray(data.words) || data.words.length === 0) {
            throw new Error('Invalid or missing words in WordpackModel data');
        }

        const words = data.words.map((word, index) => {
            if (
                word == null ||
                typeof word !== 'object' ||
                Array.isArray(word)
            ) {
                throw new Error(`Invalid word item at index ${index}`);
            }

            if (
                typeof word.word !== 'string' ||
                word.word.trim().length === 0
            ) {
                throw new Error(`Invalid or missing word at index ${index}`);
            }

            if (
                typeof word.explanation !== 'string' ||
                word.explanation.trim().length === 0
            ) {
                throw new Error(
                    `Invalid or missing explanation at index ${index}`
                );
            }

            if (word.type !== 'active' && word.type !== 'passive') {
                throw new Error(`Invalid type at index ${index}`);
            }

            return {
                word: word.word.trim(),
                explanation: word.explanation.trim(),
                type: word.type
            };
        });

        this.id = data.id.trim();
        this.name = data.name.trim();
        this.author = data.author;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.words = words;
    }

    static fromJSON(value) {
        if (typeof value === 'string') {
            try {
                return new WordpackModel(JSON.parse(value));
            }
            catch (error) {
                if (error instanceof SyntaxError) {
                    throw new Error(
                        'Invalid JSON provided to WordpackModel.fromJSON'
                    );
                }

                throw error;
            }
        }

        return new WordpackModel(value);
    }
}

module.exports = WordpackModel;