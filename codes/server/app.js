const express = require('express');
const logger = require('./logs/Winston');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { getConfig } = require('./config/configLoader')
require('dotenv').config();

// 路由
const healthCheckRouter = require('./apis/core/health-check');
const wordRouter = require('./apis/core/word');

const app = express();

app.use(morgan('combined', { stream: logger.stream }));

app.use(helmet());

app.use(cors({
    origin: getConfig('cors.origin'),
    methods: getConfig('cors.methods'),
    allowedHeaders: getConfig('cors.allowedHeaders'),
    credentials: getConfig('cors.credentials')
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 注册路由
app.use('/', healthCheckRouter);
app.use('/word', wordRouter);

app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
