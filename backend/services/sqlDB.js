import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// __dirname untuk ESModule
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
  override: false,
});

// Base config (Railway Variables)
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00",
};

// ===============================
// ✅ SSL handling (Aiven friendly)
// ===============================
// 1) Kalau ada DB_SSL_CA (isi PEM string), pakai itu
// 2) Kalau ada file ca.pem, pakai itu
// 3) Kalau DB_SSL=true, pakai ssl: {} (cukup untuk ssl-mode=REQUIRED di banyak provider)
// 4) Default: ssl off
const wantSSL = (process.env.DB_SSL || "").toLowerCase() === "true";

if (process.env.DB_SSL_CA && process.env.DB_SSL_CA.trim().length > 0) {
  poolConfig.ssl = { ca: process.env.DB_SSL_CA };
  console.log("🔐 MySQL SSL enabled (DB_SSL_CA from env).");
} else {
  const caPath = path.join(__dirname, "ca.pem");
  if (fs.existsSync(caPath)) {
    poolConfig.ssl = { ca: fs.readFileSync(caPath, "utf8") };
    console.log("🔐 MySQL SSL enabled (ca.pem found).");
  } else if (wantSSL) {
    poolConfig.ssl = {}; // penting untuk Aiven ssl-mode=REQUIRED
    console.log("🔐 MySQL SSL enabled (no CA, ssl-mode=REQUIRED).");
  } else {
    console.log("🔓 MySQL SSL disabled.");
  }
}

const pool = mysql.createPool(poolConfig);

pool.on("connection", (conn) => {
  conn.query("SET time_zone = '+07:00'");
});

// Tes koneksi otomatis saat start
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Database connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ Failed to connect to database FULL ERROR:");
    console.error(err); // <-- INI PENTING
  }
})();


export const dbService = {
  async readUsers() {
    const [rows] = await pool.query("SELECT id, username, email FROM users");
    return rows;
  },

  async createUser({ username, email, password }) {
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password]
    );
    return result.insertId;
  },

  async findUserByIdentifier(identifier) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1",
      [identifier, identifier]
    );
    return rows[0] || null;
  },

  async findUserByUsername(username) {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return rows[0] || null;
  },

  async readProduct() {
    const [rows] = await pool.query("SELECT * FROM products");
    return rows;
  },

  async upsertProduct(product) {
    await pool.query(
      `INSERT INTO products 
        (id, namaItem, catid, supid, keterangan, hargaSatuan, stok, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         namaItem = VALUES(namaItem),
         catid = VALUES(catid),
         supid = VALUES(supid),
         keterangan = VALUES(keterangan),
         hargaSatuan = VALUES(hargaSatuan),
         stok = VALUES(stok),
         foto = VALUES(foto)`,
      [
        product.id,
        product.namaItem,
        product.catid,
        product.supid,
        product.keterangan,
        product.hargaSatuan,
        product.stok,
        product.foto,
      ]
    );
  },

  async nextId(table, idColumn = "id") {
    const [rows] = await pool.query(
      `SELECT MAX(${idColumn}) AS maxId FROM ${table}`
    );
    return (rows[0].maxId || 0) + 1;
  },
};

export const db = pool;
export default pool;
