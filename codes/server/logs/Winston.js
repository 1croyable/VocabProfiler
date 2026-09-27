const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');
const { getConfig } = require('../config/configLoader');

class Logger {
    constructor() {
        this.logConfig = getConfig('logging');
        this.logDirectory = path.join(__dirname, '../logs');

        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory);
        }

        this.logger = this.createLogger(); // 记录所有日志，在开发环境下会输出到控制台
        this.accessLogger = this.createAccessLogger(); // 只记录http请求

        // 如果是开发环境，将日志输出到控制台
        if (getConfig('server.environment') === 'development') {
            this.logger.add(new transports.Console({
                level: 'debug',
                format: format.combine(
                    format.colorize(),
                    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    format.printf(({ timestamp, level, message }) => {
                        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
                    })
                )
            }));
        }

        // 单独为 HTTP 请求设置一个流
        this.logger.stream = {
            write: (message) => {
                this.accessLogger.http(message.trim());
            },
        };
    }

    // 创建一个新的日志记录器，会记录到文件
    createLogger() {
        return createLogger({
            level: this.logConfig.level || 'info',
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.errors({ stack: true }),
                format.printf(({ timestamp, level, message, stack }) => {
                    return stack 
                        ? `${timestamp} [${level.toUpperCase()}]: ${message}\nStack: ${stack}`
                        : `${timestamp} [${level.toUpperCase()}]: ${message}`;
                })
            ),
            transports: [
                new transports.File({
                    filename: path.join(this.logDirectory, 'error.log'),
                    level: 'error',
                    format: format.combine(
                        format.timestamp(),
                        format.json()
                    )
                }),
                new transports.File({
                    filename: path.join(this.logDirectory, 'app.log'),
                    level: this.logConfig.level || 'info',
                    format: format.combine(
                        format.timestamp(),
                        format.json()
                    )
                })
            ]
        });
    }

    // 创建一个新的日志记录器，只记录 HTTP 请求
    createAccessLogger() {
        return createLogger({
            level: 'http',
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.json()
            ),
            transports: [
                new transports.File({
                    filename: path.join(this.logDirectory, 'access.log')
                })
            ]
        });
    }
}

module.exports = new Logger().logger;