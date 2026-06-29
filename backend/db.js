const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'schemes.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database.');
    initDb();
  }
});

function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      benefits TEXT,
      required_documents TEXT,
      apply_link TEXT,
      last_date TEXT,
      ministry TEXT,
      scheme_type TEXT,
      is_active BOOLEAN DEFAULT 1,
      eligibility TEXT,
      source_url TEXT DEFAULT ''
    )
  `, () => {
    // Migration: add source_url column if it doesn't exist in older databases
    db.run(`ALTER TABLE schemes ADD COLUMN source_url TEXT DEFAULT ''`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        // Column already exists or other non-critical error — ignore
      }
    });
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS review_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      headline TEXT NOT NULL,
      content TEXT,
      name TEXT,
      source_url TEXT,
      source_name TEXT,
      ai_confidence INTEGER,
      ai_reason TEXT,
      verification_status TEXT,
      official_portal TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_suspended BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scraper_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_name TEXT NOT NULL,
      status TEXT NOT NULL,
      schemes_found INTEGER DEFAULT 0,
      schemes_updated INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  // User profiles table — stores the eligibility form submissions
  db.run(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      full_name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      has_disability BOOLEAN DEFAULT 0,
      disability_type TEXT,
      disability_percentage INTEGER DEFAULT 0,
      state TEXT,
      district TEXT,
      category TEXT,
      family_income REAL,
      education_level TEXT,
      udid_number TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(username)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      full_name TEXT
    )
  `, () => {
    // Migrations
    db.run(`ALTER TABLE admins ADD COLUMN email TEXT`, (err) => { });
    db.run(`ALTER TABLE admins ADD COLUMN full_name TEXT`, (err) => { });

    // Seed default admin
    db.get("SELECT * FROM admins WHERE username = 'admin'", (err, row) => {
      if (!row) {
        db.run("INSERT INTO admins (username, password, email, full_name) VALUES ('admin', 'admin@123', 'admin@example.com', 'System Admin')");
      }
    });
  });
}

module.exports = db;
