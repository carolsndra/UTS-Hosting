import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Railway/production: ENV dari Railway Variables (dotenv boleh tetap, tapi tidak wajib)
dotenv.config();

// __dirname untuk ESModule
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ✅ SSL OPTIONAL (untuk Aiven/local kalau butuh)
// Prioritas 1: kalau Anda set ENV DB_SSL_CA (isi cert PEM string) -> dipakai
// Prioritas 2: kalau ada file ca.pem di folder ini -> dipakai
if (process.env.DB_SSL_CA && process.env.DB_SSL_CA.trim().length > 0) {
  poolConfig.ssl = { ca: process.env.DB_SSL_CA };
  console.log("🔐 MySQL SSL enabled (DB_SSL_CA from env).");
} else {
  const caPath = path.join(__dirname, "ca.pem");
  if (fs.existsSync(caPath)) {
    poolConfig.ssl = { ca: fs.readFileSync(caPath, "utf8") };
    console.log("🔐 MySQL SSL enabled (ca.pem found).");
  } else {
    console.log("🔓 MySQL SSL disabled (no CA provided).");
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
    console.error("❌ Failed to connect to database:", err.message);
  }
})();

export const dbService = {
  // ======== USERS ========
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

  // ======== PRODUCTS ========
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
