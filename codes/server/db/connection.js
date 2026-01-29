const mysql = require('mysql2');
const { getConfig } = require('../config/configLoader');
const logger = require('../logs/Winston');
require('dotenv').config();

class MysqlConnection {
    constructor(db = null){
        this.pools = {}; // 其实就是在维护一个连接池对象，为每个database分配一个连接池
        this.createPool(db);
    }

    createPool(db = null) {
        if (!db) {
            db = getConfig('db.database');
        }

        if (this.pools[db]) {
            return this.pools[db];
        }

        // 如果没有这个数据库对应的连接池，就新建一个并测试连接
        const params = {
            host: getConfig('db.host'),
            user: getConfig('db.user'),
            password: getConfig('db.password'),
            database: db,
            port: getConfig('db.port'),
            waitForConnections: getConfig('db.waitForConnections'),
            connectionLimit: getConfig('db.connectionLimit'),
            queueLimit: getConfig('db.queueLimit')
        };

        console.log(JSON.stringify(params));

        const pool = mysql.createPool(params);

        pool.getConnection((err, connection) => {
            if (err) {
                switch (err.code) {
                    case 'PROTOCOL_CONNECTION_LOST':
                        logger.error('❌ 数据库连接丢失:', err.message);
                        break;
                    case 'ER_CON_COUNT_ERROR':
                        logger.error('❌ 数据库连接数过多:', err.message);
                        break;
                    case 'ECONNREFUSED':
                        logger.error('❌ 数据库连接被拒绝:', err.message);
                        break;
                    default:
                        logger.error('❌ 数据库连接失败:', err.message);
                }
            } else {
                logger.info(`✅ 数据库 ${db} 连接成功`);
                connection.release();
            }
        });

        this.pools[db] = pool.promise();
        return this.pools[db];
    }

    async execute(db, query, params=[]) {
        // 也支持非参数化查询
        const pool = this.createPool(db);
        try {
            const [results] = await pool.execute(query, params);
            return results;
        } catch (err) {
            logger.error('❌ SQL 查询失败:', err.message);
            throw err;
        }
    }
};

module.exports = new MysqlConnection();