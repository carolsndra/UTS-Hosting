import { db } from "../services/sqlDB.js";
import bcrypt from "bcrypt";
import cloudinary from "../services/cloudinary.js";

function generateUserId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function generateUniqueUserId(existingIds, maxTry = 100) {
  const used = new Set(existingIds.map(String));
  for (let i = 0; i < maxTry; i++) {
    const id = generateUserId();
    if (!used.has(id)) return id;
  }
  return `${Date.now()}`.slice(-4);
}

export async function login(req, res) {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Username/email dan password wajib diisi" });
    }

    const [rows] = await db.query(
      "SELECT id, username, email, password, foto FROM users WHERE username = ? OR email = ? LIMIT 1",
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    res.json({
      message: "Login sukses",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.foto || null
      }
    });

  } catch (err) {
    console.error("❌ Error login:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};

    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password minimal 8 karakter" });
    }

    const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
    if (!symbolRegex.test(password)) {
      return res.status(400).json({ message: "Password harus mengandung minimal satu simbol" });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Email harus mengandung karakter @" });
    }

    const [exist] = await db.query(
      "SELECT username, email FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (exist.length > 0) {
      return res.status(409).json({ message: "Username atau email sudah terdaftar" });
    }

    const [all] = await db.query("SELECT id FROM users");
    const id = generateUniqueUserId(all.map(u => u.id));

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
      [id, username, email, hashed]
    );

    res.json({
      message: "Registrasi berhasil",
      user: { id, username, email }
    });

  } catch (err) {
    console.error("❌ Error register:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { id, username, email, password } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: "User ID diperlukan" });
    }

    const [exist] = await db.query(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (exist.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const [conflict] = await db.query(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
      [username, email, id]
    );

    if (conflict.length > 0) {
      return res.status(409).json({ message: "Username/email sudah digunakan" });
    }

    let avatarUrl = null;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "avatars",
        }
      );
      avatarUrl = uploadResult.secure_url;
    }

    let query = "UPDATE users SET username = ?, email = ?";
    const params = [username, email];

    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      query += ", password = ?";
      params.push(hashed);
    }

    if (avatarUrl) {
      query += ", foto = ?";
      params.push(avatarUrl);
    }

    query += " WHERE id = ?";
    params.push(id);

    await db.query(query, params);

    const [updated] = await db.query(
      "SELECT id, username, email, foto FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    const userData = updated[0];

    res.json({
      message: "Profile berhasil diperbarui",
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatar: userData.foto || null
      }
    });

  } catch (err) {
    console.error("❌ Error update profile:", err);
    res.status(500).json({ message: "Server error" });
  }
}
