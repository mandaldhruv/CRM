const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
    allowExitOnIdle: false,
    ssl: useSsl
        ? {
            rejectUnauthorized: isProduction
        }
        : false
});

pool.on('error', (error) => {
    console.error('[DB] Unexpected idle client error');
    console.error(error.message);
});

const query = (text, params = []) => pool.query(text, params);

const testConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('[DB] PostgreSQL connection established successfully.');
    } catch (error) {
        console.error('[DB] PostgreSQL connection failed.');
        console.error(error.message);
        throw new Error('Database connection failed');
    }
};

module.exports = {
    pool,
    query,
    testConnection
};
