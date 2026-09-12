import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pgPool = null;
let sqliteDb = null;
let activeEngine = 'unknown';

// Convert PostgreSQL parameterized query ($1, $2) to SQLite format (?)
function convertPgToSqlite(sql) {
  // Replace $1, $2, etc. with ?
  let converted = sql.replace(/\$\d+/g, '?');
  // Handle ILIKE -> LIKE in SQLite
  converted = converted.replace(/\bILIKE\b/gi, 'LIKE');
  return converted;
}

export async function initDb() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // 1. Try PostgreSQL if DATABASE_URL is configured
  if (config.databaseUrl && (config.databaseUrl.startsWith('postgres://') || config.databaseUrl.startsWith('postgresql://'))) {
    try {
      console.log('[DB] Connecting to PostgreSQL at DATABASE_URL...');
      const pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
      });

      const client = await pool.connect();
      client.release();
      pgPool = pool;
      activeEngine = 'PostgreSQL';
      console.log('[DB] Successfully connected to PostgreSQL.');

      // Adapt schema for PostgreSQL (replace AUTOINCREMENT with SERIAL or identity)
      let pgSchema = schemaSql
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

      // Execute schema statements
      await pgPool.query(pgSchema);
      console.log('[DB] PostgreSQL schema initialized successfully.');
      return;
    } catch (err) {
      console.warn(`[DB] PostgreSQL connection failed (${err.message}). Falling back to embedded SQLite.`);
    }
  }

  // 2. Embedded SQLite engine fallback
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const dbDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbFilePath = path.join(dbDir, 'edumentor.db');
    sqliteDb = new DatabaseSync(dbFilePath);
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
    sqliteDb.exec(schemaSql);
    activeEngine = 'SQLite';
    console.log(`[DB] SQLite database active at: ${dbFilePath}`);
  } catch (sqliteErr) {
    console.error('[DB] Failed to initialize database:', sqliteErr);
    throw sqliteErr;
  }
}

export async function query(text, params = []) {
  const sanitizedParams = (params || []).map((p) => (p === undefined ? null : p));

  if (activeEngine === 'PostgreSQL' && pgPool) {
    const res = await pgPool.query(text, sanitizedParams);
    return { rows: res.rows, rowCount: res.rowCount };
  }

  if (sqliteDb) {
    try {
      const sqliteSql = convertPgToSqlite(text.trim());
      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteSql);
      const isReturning = /\bRETURNING\b/i.test(sqliteSql);

      const stmt = sqliteDb.prepare(sqliteSql);

      if (isSelect || isReturning) {
        const rows = stmt.all(...sanitizedParams);
        return { rows, rowCount: rows.length };
      } else {
        const info = stmt.run(...sanitizedParams);
        return {
          rows: [],
          rowCount: info.changes,
          lastInsertRowid: info.lastInsertRowid,
        };
      }
    } catch (err) {
      console.error('[DB Query Error]', err.message, 'SQL:', text, 'Params:', sanitizedParams);
      throw err;
    }
  }

  throw new Error('[DB] No active database engine available.');
}

export function getDbInfo() {
  return {
    engine: activeEngine,
    isPostgres: activeEngine === 'PostgreSQL',
    isSqlite: activeEngine === 'SQLite',
  };
}

export default {
  initDb,
  query,
  getDbInfo,
};
