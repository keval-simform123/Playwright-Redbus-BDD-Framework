import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Ensure env variables are loaded from the root .env
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

  // 1. First ensure the database exists by connecting to MySQL without db name specified
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });

  try {
    console.log(`[Database] Ensuring database "${dbConfig.database}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
  } catch (error) {
    console.error('[Database] Failed to ensure database exists:', error);
    throw error;
  } finally {
    await connection.end();
  }

  // 2. Create the connection pool with the database specified
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

  // 3. Ensure the sessions table exists
  try {
    console.log('[Database] Ensuring table "playwright_sessions" exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playwright_sessions (
        id VARCHAR(255) PRIMARY KEY,
        session_data LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('[Database] Failed to ensure table exists:', error);
    throw error;
  }

  return pool;
}

/**
 * Saves a session's raw JSON data under a key.
 */
export async function saveSession(id: string, sessionData: string): Promise<void> {
  const activePool = await getPool();
  console.log(`[Database] Saving session "${id}" to database...`);
  await activePool.query(
    `INSERT INTO playwright_sessions (id, session_data) 
     VALUES (?, ?) 
     ON DUPLICATE KEY UPDATE session_data = VALUES(session_data);`,
    [id, sessionData]
  );
  console.log(`[Database] Session "${id}" saved successfully.`);
}

/**
 * Retrieves a session's raw JSON data by key.
 */
export async function getSession(id: string): Promise<string | null> {
  const activePool = await getPool();
  console.log(`[Database] Retrieving session "${id}" from database...`);
  const [rows] = await activePool.query<any>(
    'SELECT session_data FROM playwright_sessions WHERE id = ?;',
    [id]
  );
  if (rows && rows.length > 0) {
    console.log(`[Database] Session "${id}" retrieved successfully.`);
    return rows[0].session_data;
  }
  console.log(`[Database] Session "${id}" not found in database.`);
  return null;
}

/**
 * Deletes a session by key.
 */
export async function deleteSession(id: string): Promise<void> {
  const activePool = await getPool();
  console.log(`[Database] Deleting session "${id}" from database...`);
  await activePool.query('DELETE FROM playwright_sessions WHERE id = ?;', [id]);
  console.log(`[Database] Session "${id}" deleted successfully.`);
}

/**
 * Closes the database pool.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    console.log('[Database] Closing database connection pool...');
    await pool.end();
    pool = null;
    console.log('[Database] Connection pool closed.');
  }
}
