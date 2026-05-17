const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/configLoader');
const logger = require('../logs/Winston');

module.exports = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        logger.warn('未提供有效的Token');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, getConfig('jwt.secret'));
        req.user = decoded;
        next();
    } catch (err) {
        logger.error('Token验证失败', { error: err.message });
        return res.status(403).json({ message: 'Invalid Token' });
    }
};