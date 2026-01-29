const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/configLoader');
const logger = require('../logs/Winston');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('未提供有效的Token');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        logger.warn('未提供有效的Token');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, getConfig('jwt.secret'));
        logger.info('Token验证成功', { decoded });
        req.decoded = decoded;
        next();
    } catch (err) {
        logger.error('Token验证失败', { error: err.message });
        return res.status(403).json({ message: 'Invalid Token' });
    }
};