import pool from "../services/sqlDB.js";
const db = pool;

export const supplierController = {
  getAll: async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT supid, namaSupplier, kontak, alamat
        FROM suppliers
        ORDER BY supid ASC
      `);

      res.json({ suppliers: rows });
    } catch (err) {
      console.error("Error getAll suppliers:", err);
      res.status(500).json({ message: "Gagal mengambil data supplier" });
    }
  },

  // POST /suppliers 
  create: async (req, res) => {
    try {
      const { namaSupplier, kontak, alamat } = req.body;

      if (!namaSupplier || !namaSupplier.trim()) {
        return res.status(400).json({ message: "Nama supplier wajib diisi" });
      }

      const [maxRow] = await db.query(`
        SELECT MAX(CAST(SUBSTRING(supid, 2) AS UNSIGNED)) AS maxId
        FROM suppliers
      `);

      const maxId = maxRow[0].maxId || 0;   
      const nextNum = maxId + 1;            
      const nextSupid = "S" + String(nextNum).padStart(3, "0"); 

      await db.query(
        `INSERT INTO suppliers (supid, namaSupplier, kontak, alamat)
         VALUES (?, ?, ?, ?)`,
        [nextSupid, namaSupplier.trim(), kontak || null, alamat || null]
      );

      const [newSupplier] = await db.query(
        `SELECT supid, namaSupplier, kontak, alamat
         FROM suppliers
         WHERE supid = ?`,
        [nextSupid]
      );

      res.status(201).json({ supplier: newSupplier[0] });

    } catch (err) {
      console.error("Error create supplier:", err);
      res.status(500).json({ message: "Gagal menambah supplier" });
    }
  },

};
