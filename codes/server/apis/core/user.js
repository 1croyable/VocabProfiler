const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const connection = require('../../db/connection');
const { getConfig } = require('../../config/configLoader');
const authMiddleware = require('../../middlewares/authMiddleware')

function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        getConfig('jwt.secret'),
        {
            expiresIn: getConfig('jwt.defaultExpires')
        }
    );
}

function setTokenCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ error: 'username and password are required' });

        const existing = await connection.execute(
            'vocab_profiler_db',
            'SELECT id FROM users WHERE username = ? LIMIT 1',
            [username]
        );

        if (existing.length > 0)
            return res.status(409).json({ error: 'Username already exists' });

        const passwordHash = await bcrypt.hash(password, 12);

        // 插入新用户
        const result = await connection.execute(
            'vocab_profiler_db',
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, passwordHash]
        );
        // 创建默认笔记本
        await connection.execute(
            'vocab_profiler_db',
            'INSERT INTO notebooks (user_id, name) VALUES (?, ?)',
            [result.insertId, 'Default Notebook']
        );

        const user = {
            id: result.insertId,
            username,
            role: 'user'
        };

        const token = createToken(user);
        setTokenCookie(res, token);

        res.status(201).json({
            message: 'Registration successful',
            user
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const users = await connection.execute(
            'vocab_profiler_db',
            'SELECT id, username, password, role FROM users WHERE username = ? LIMIT 1',
            [username]
        );

        if (users.length === 0)
            return res.status(401).json({ error: 'Invalid username or password' });

        const user = users[0];

        const ok = await bcrypt.compare(password, user.password);

        if (!ok)
            return res.status(401).json({ error: 'Invalid username or password' });

        await connection.execute(
            'vocab_profiler_db',
            'UPDATE users SET last_login_at = NOW() WHERE id = ?',
            [user.id]
        );

        const safeUser = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        const token = createToken(safeUser);
        setTokenCookie(res, token);

        res.json({
            message: 'Login successful',
            user: safeUser
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to login user' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax'
    });

    res.json({ message: 'Logout successful' });
});

router.get('/me', authMiddleware, (req, res) => {
    res.json({
        user: req.user
    });
});

router.get('/notebooks', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const sql = 'SELECT id, name FROM notebooks WHERE user_id = ?';

    try {
        const notebooks = await connection.execute('vocab_profiler_db', sql, [userId]);
        res.json(notebooks.sort((a, b) => a.id - b.id));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notebook IDs' });
    }
});

module.exports = router;