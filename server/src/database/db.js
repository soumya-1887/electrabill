/**
 * SQLite Database Connection & Initialization Module
 * Using Node 24's native node:sqlite DatabaseSync for zero native compile dependencies
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Ensure database storage directory exists
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'electrabill.db');

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    // Enforce foreign key constraints
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

/**
 * Initialize database schema
 */
function initDatabase() {
  const db = getDatabase();

  // Create Customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      meter_number TEXT NOT NULL UNIQUE,
      address TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Bills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      units_consumed REAL NOT NULL,
      slab_1_amount REAL NOT NULL,
      slab_2_amount REAL NOT NULL,
      slab_3_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      rate_slab_1 REAL DEFAULT 2.0,
      rate_slab_2 REAL DEFAULT 3.0,
      rate_slab_3 REAL DEFAULT 5.0,
      billing_period TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'Unpaid',
      notes TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    );
  `);

  // Create indexes for fast lookup
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_meter ON customers(meter_number);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(full_name);
    CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);
    CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(generated_at);
  `);

  return db;
}

/**
 * Execute parameterized query returning multiple rows
 */
function all(sql, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute parameterized query returning single row
 */
function get(sql, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * Execute parameterized insert/update/delete
 */
function run(sql, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute raw multi-statement SQL
 */
function exec(sql) {
  const db = getDatabase();
  return db.exec(sql);
}

module.exports = {
  getDatabase,
  initDatabase,
  all,
  get,
  run,
  exec,
  dbPath
};
