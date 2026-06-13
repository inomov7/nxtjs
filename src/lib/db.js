import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import {
  getDefaultClinicSettings,
  getDefaultStaff,
  getDefaultRooms,
  getDefaultPatients,
  getDefaultMedicines,
  getDefaultServices,
  getDefaultFinances,
  getDefaultPayments,
  getDefaultPrescriptionQueue,
  getDefaultNotifications,
  getDefaultActivityLog,
  getDefaultCallLog,
  getDefaultSuppliers
} from './demoData';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'klinika.db');

// Password Hashing helpers
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  if (!storedPassword || typeof storedPassword !== 'string') return false;
  if (!storedPassword.includes(':')) {
    // Plain text fallback (e.g. for legacy or default config seeds)
    return password === storedPassword;
  }
  const [salt, hash] = storedPassword.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === checkHash;
}

// Promise-based SQL helpers
export function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Open Database Connection Helper
export function openDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) reject(err);
      else {
        db.configure("busyTimeout", 5000);
        resolve(db);
      }
    });
  });
}

let isDbInitPromise = null;

export function ensureDbInit() {
  if (!isDbInitPromise) {
    isDbInitPromise = readDb().then(() => true).catch(err => {
      isDbInitPromise = null; // retry on next call
      throw err;
    });
  }
  return isDbInitPromise;
}

// Initialize tables and seed default data
export async function readDb() {
  await fs.mkdir(DB_DIR, { recursive: true });
  const db = await openDb();

  try {
    // Create Relational Tables
    await run(db, `CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS smsQueue (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS treatments (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS finances (
      date TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS prescriptionQueue (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS activityLog (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS clinicSettings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS callLog (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      value TEXT
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId TEXT,
      role TEXT,
      expiresAt TEXT
    )`);

    // Helper to check if a table is empty
    const isTableEmpty = async (tableName) => {
      const row = await get(db, `SELECT COUNT(*) as count FROM ${tableName}`);
      return row.count === 0;
    };

    // Transactional Seeding
    await run(db, 'BEGIN TRANSACTION');

    // 1. Seed Staff
    if (await isTableEmpty('staff')) {
      const defaultAdminStaff = {
        id: 'STF-ADMIN',
        firstName: 'Admin',
        lastName: 'Admin',
        role: 'admin',
        username: 'admin',
        password: hashPassword('admin'),
        phone: '+998901234567',
        email: 'admin@klinika.uz',
        address: 'Klinika',
        salary: 0,
        active: true,
        specialization: 'Administrator',
        workDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'],
        hireDate: new Date().toISOString().split('T')[0],
        patientsServed: 0,
        hoursWorked: 0
      };

      await run(db, `INSERT INTO staff (id, username, password, value) VALUES (?, ?, ?, ?)`, [
        defaultAdminStaff.id,
        defaultAdminStaff.username,
        defaultAdminStaff.password,
        JSON.stringify(defaultAdminStaff)
      ]);
    }

    // 2. Seed Rooms (Not seeding demo data anymore)
    // 3. Seed Patients (Not seeding demo data anymore)
    // 4. Seed Medicines (Not seeding demo data anymore)
    // 5. Seed Services (Not seeding demo data anymore)
    // 6. Seed Finances (Not seeding demo data anymore)
    // 7. Seed Payments (Not seeding demo data anymore)
    // 8. Seed PrescriptionQueue (Not seeding demo data anymore)
    // 9. Seed Notifications (Not seeding demo data anymore)
    // 10. Seed ActivityLog (Not seeding demo data anymore)

    // 11. Seed ClinicSettings
    if (await isTableEmpty('clinicSettings')) {
      const settings = getDefaultClinicSettings();
      for (const [key, val] of Object.entries(settings)) {
        await run(db, `INSERT INTO clinicSettings (key, value) VALUES (?, ?)`, [key, JSON.stringify(val)]);
      }
    }

    // 12. Seed CallLog (Not seeding demo data anymore)
    // 13. Seed Suppliers (Not seeding demo data anymore)

    await run(db, 'COMMIT');

    // Load and return entire data structure
    const data = {};
    const tables = [
      'staff', 'rooms', 'patients', 'medicines', 'services', 'finances',
      'payments', 'prescriptionQueue', 'notifications', 'activityLog',
      'callLog', 'suppliers', 'smsQueue', 'treatments'
    ];

    for (const t of tables) {
      const rows = await all(db, `SELECT value FROM ${t}`);
      data[t] = rows.map(r => JSON.parse(r.value));
    }

    // Load Settings
    const settingsRows = await all(db, `SELECT * FROM clinicSettings`);
    const settings = {};
    settingsRows.forEach(r => {
      settings[r.key] = JSON.parse(r.value);
    });
    data.clinicSettings = settings;

    return data;
  } catch (error) {
    await run(db, 'ROLLBACK').catch(() => {});
    throw error;
  } finally {
    db.close();
  }
}

// Granular Entity CRUD
export async function insertEntity(table, item) {
  await ensureDbInit();
  const db = await openDb();
  try {
    const id = item.id;
    if (table === 'staff') {
      const hashed = item.password ? hashPassword(item.password) : null;
      const val = { ...item, password: hashed };
      await run(db, `INSERT INTO staff (id, username, password, value) VALUES (?, ?, ?, ?)`, [
        id,
        item.username || null,
        hashed,
        JSON.stringify(val)
      ]);
    } else if (table === 'finances') {
      await run(db, `INSERT OR REPLACE INTO finances (date, value) VALUES (?, ?)`, [item.date, JSON.stringify(item)]);
    } else if (table === 'clinicSettings') {
      // key-value table
      for (const [key, val] of Object.entries(item)) {
        await run(db, `INSERT OR REPLACE INTO clinicSettings (key, value) VALUES (?, ?)`, [key, JSON.stringify(val)]);
      }
    } else {
      await run(db, `INSERT OR REPLACE INTO ${table} (id, value) VALUES (?, ?)`, [id, JSON.stringify(item)]);
    }
  } finally {
    db.close();
  }
}

export async function updateEntity(table, id, updates) {
  await ensureDbInit();
  const db = await openDb();
  try {
    if (table === 'clinicSettings') {
      for (const [key, val] of Object.entries(updates)) {
        await run(db, `INSERT OR REPLACE INTO clinicSettings (key, value) VALUES (?, ?)`, [key, JSON.stringify(val)]);
      }
      return;
    }

    // Get current record
    const pk = table === 'finances' ? 'date' : 'id';
    const row = await get(db, `SELECT value FROM ${table} WHERE ${pk} = ?`, [id]);
    if (!row) throw new Error(`Record not found in ${table} with id/date ${id}`);
    
    const currentVal = JSON.parse(row.value);
    const updatedVal = { ...currentVal, ...updates };

    if (table === 'staff') {
      let hashed = currentVal.password;
      if (updates.password && updates.password !== currentVal.password) {
        hashed = hashPassword(updates.password);
        updatedVal.password = hashed;
      }
      await run(db, `UPDATE staff SET username = ?, password = ?, value = ? WHERE id = ?`, [
        updatedVal.username,
        hashed,
        JSON.stringify(updatedVal),
        id
      ]);
    } else {
      await run(db, `UPDATE ${table} SET value = ? WHERE ${pk} = ?`, [JSON.stringify(updatedVal), id]);
    }
  } finally {
    db.close();
  }
}

export async function deleteEntity(table, id) {
  await ensureDbInit();
  const db = await openDb();
  try {
    const pk = table === 'finances' ? 'date' : 'id';
    await run(db, `DELETE FROM ${table} WHERE ${pk} = ?`, [id]);
  } finally {
    db.close();
  }
}

// Session Management
export async function createSession(userId, role) {
  await ensureDbInit();
  const db = await openDb();
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    await run(db, `INSERT INTO sessions (token, userId, role, expiresAt) VALUES (?, ?, ?, ?)`, [
      token,
      userId,
      role,
      expiresAt
    ]);
    return token;
  } finally {
    db.close();
  }
}

export async function getSession(token) {
  if (!token) return null;
  await ensureDbInit().catch(() => {});
  const db = await openDb();
  try {
    const session = await get(db, `SELECT * FROM sessions WHERE token = ?`, [token]);
    if (!session) return null;
    
    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      await run(db, `DELETE FROM sessions WHERE token = ?`, [token]);
      return null;
    }
    return session;
  } finally {
    db.close();
  }
}

export async function deleteSession(token) {
  await ensureDbInit().catch(() => {});
  const db = await openDb();
  try {
    await run(db, `DELETE FROM sessions WHERE token = ?`, [token]);
  } finally {
    db.close();
  }
}

// Validate credentials
export async function authenticateUser(username, password) {
  await ensureDbInit();
  const db = await openDb();
  try {
    const userRow = await get(db, `SELECT * FROM staff WHERE LOWER(username) = LOWER(?)`, [username]);
    if (!userRow) return null;
    
    const isCorrect = verifyPassword(password, userRow.password);
    if (!isCorrect) return null;
    
    return JSON.parse(userRow.value);
  } finally {
    db.close();
  }
}

// Legacy writeDb fallback (replaces all rows in a table - useful for full sync/restore settings)
export async function writeDb(data) {
  await ensureDbInit();
  const db = await openDb();
  try {
    await run(db, 'BEGIN TRANSACTION');
    for (const [key, val] of Object.entries(data)) {
      if (key === 'clinicSettings') {
        for (const [k, v] of Object.entries(val)) {
          await run(db, `INSERT OR REPLACE INTO clinicSettings (key, value) VALUES (?, ?)`, [k, JSON.stringify(v)]);
        }
      } else {
        const pk = key === 'finances' ? 'date' : 'id';
        await run(db, `DELETE FROM ${key}`);
        for (const item of val) {
          if (key === 'staff') {
            await run(db, `INSERT INTO staff (id, username, password, value) VALUES (?, ?, ?, ?)`, [
              item.id,
              item.username,
              item.password,
              JSON.stringify(item)
            ]);
          } else {
            await run(db, `INSERT INTO ${key} (${pk}, value) VALUES (?, ?)`, [item[pk], JSON.stringify(item)]);
          }
        }
      }
    }
    await run(db, 'COMMIT');
  } catch (e) {
    await run(db, 'ROLLBACK').catch(() => {});
    throw e;
  } finally {
    db.close();
  }
}

export async function deleteDb() {
  const db = await openDb();
  try {
    const tables = [
      'staff', 'rooms', 'patients', 'medicines', 'services', 'finances',
      'payments', 'prescriptionQueue', 'notifications', 'activityLog',
      'clinicSettings', 'callLog', 'suppliers', 'sessions', 'smsQueue', 'treatments'
    ];
    for (const t of tables) {
      await run(db, `DROP TABLE IF EXISTS ${t}`);
    }
  } finally {
    db.close();
  }
}
