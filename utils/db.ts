import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Root@123',
  database: process.env.DB_NAME || 'playwright_db',
};

let pool: mysql.Pool | null = null;

async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  // ensure database exists
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });

  try {
    console.log(`[DB] Ensuring database "${dbConfig.database}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
  } catch (error) {
    console.error('[DB] Failed to create database:', error);
    throw error;
  } finally {
    await connection.end();
  }

  // create connection pool
  pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // ensure sessions table exists
  try {
    console.log('[DB] Ensuring sessions table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playwright_sessions (
        id VARCHAR(255) PRIMARY KEY,
        session_data LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('[DB] Failed to create table:', error);
    throw error;
  }

  return pool;
}

export async function saveSession(id: string, sessionData: string): Promise<void> {
  const activePool = await getPool();
  console.log(`[DB] Saving session "${id}"...`);
  await activePool.query(
    `INSERT INTO playwright_sessions (id, session_data) 
     VALUES (?, ?) 
     ON DUPLICATE KEY UPDATE session_data = VALUES(session_data);`,
    [id, sessionData]
  );
  console.log(`[DB] Session "${id}" saved.`);
}

export async function getSession(id: string): Promise<string | null> {
  const activePool = await getPool();
  console.log(`[DB] Fetching session "${id}"...`);
  const [rows] = await activePool.query<any>(
    'SELECT session_data FROM playwright_sessions WHERE id = ?;',
    [id]
  );
  if (rows && rows.length > 0) {
    console.log(`[DB] Session "${id}" found.`);
    return rows[0].session_data;
  }
  console.log(`[DB] Session "${id}" not found.`);
  return null;
}

export async function deleteSession(id: string): Promise<void> {
  const activePool = await getPool();
  console.log(`[DB] Deleting session "${id}"...`);
  await activePool.query('DELETE FROM playwright_sessions WHERE id = ?;', [id]);
  console.log(`[DB] Session "${id}" deleted.`);
}

export async function closePool(): Promise<void> {
  if (pool) {
    console.log('[DB] Closing connection pool...');
    await pool.end();
    pool = null;
    console.log('[DB] Pool closed.');
  }
}
