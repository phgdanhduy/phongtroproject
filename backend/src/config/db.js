require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres_db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'vnu_admin',
  password: process.env.DB_PASSWORD || 'vnu_secret_2026',
  database: process.env.DB_NAME || 'vnu_living_db',
});
module.exports = pool;

pool.on('error', (err) => {
  console.error('[Database Pool Error]:', err);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB Query]', { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
}

async function initDB(retries = 5, delayMs = 2000) {
  const initSqlPath = path.join(__dirname, '..', 'database', 'init.sql');
  const sql = fs.existsSync(initSqlPath) ? fs.readFileSync(initSqlPath, 'utf8') : null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (sql) {
        await pool.query(sql);
        console.log('✅ Database schema initialized successfully');
      } else {
        await pool.query('SELECT 1');
      }
      return;
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt}/${retries} to connect DB failed (${error.code || error.message}).`);
      if (attempt === retries) {
        console.error('❌ Failed to initialize database schema:', error);
        throw error;
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

module.exports = {
  pool,
  query,
  initDB,
};
