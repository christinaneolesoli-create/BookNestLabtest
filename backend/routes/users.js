const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  db.query(
    "SELECT id, full_name AS fullName, membership_id AS membershipId, email, role, created_at AS createdAt FROM users ORDER BY id DESC",
    (error, users) => {
      if (error) return res.status(500).json({ message: "Failed to retrieve users", error: error.message });
      res.json(users);
    }
  );
});

router.post("/", (req, res) => {
  const { fullName, membershipId, email, password = "", role = "MEMBER" } = req.body;
  if (!fullName?.trim() || !membershipId?.trim() || !email?.trim() ||
      !["ADMIN", "MEMBER"].includes(String(role).toUpperCase())) {
    return res.status(400).json({ message: "Name, membership ID, email and role are required" });
  }

  const normalizedRole = String(role).toUpperCase();
  db.query(
    "INSERT INTO users (full_name, membership_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [fullName.trim(), membershipId.trim(), email.trim(), password || "change-me", normalizedRole],
    (error, result) => {
      if (error) return res.status(500).json({ message: "Failed to add user", error: error.message });
      res.status(201).json({
        id: result.insertId,
        fullName: fullName.trim(),
        membershipId: membershipId.trim(),
        email: email.trim(),
        role: normalizedRole,
      });
    }
  );
});

router.put("/:id", (req, res) => {
  const { fullName, membershipId, email, password, role = "MEMBER" } = req.body;
  if (!fullName?.trim() || !membershipId?.trim() || !email?.trim() ||
      !["ADMIN", "MEMBER"].includes(String(role).toUpperCase())) {
    return res.status(400).json({ message: "Invalid user details" });
  }

  const normalizedRole = String(role).toUpperCase();
  const sql = password
    ? "UPDATE users SET full_name=?, membership_id=?, email=?, password_hash=?, role=? WHERE id=?"
    : "UPDATE users SET full_name=?, membership_id=?, email=?, role=? WHERE id=?";
  const params = password
    ? [fullName.trim(), membershipId.trim(), email.trim(), password, normalizedRole, req.params.id]
    : [fullName.trim(), membershipId.trim(), email.trim(), normalizedRole, req.params.id];

  db.query(sql, params, (error, result) => {
    if (error) return res.status(500).json({ message: "Failed to update user", error: error.message });
    if (!result.affectedRows) return res.status(404).json({ message: "User not found" });
    res.json({ id: Number(req.params.id), fullName: fullName.trim(), membershipId: membershipId.trim(),
      email: email.trim(), role: normalizedRole });
  });
});

router.delete("/:id", (req, res) => {
  db.query("DELETE FROM users WHERE id=?", [req.params.id], (error, result) => {
    if (error) return res.status(500).json({ message: "Failed to delete user", error: error.message });
    if (!result.affectedRows) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  });
});

router.post("/login", (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier?.trim() || !password) {
    return res.status(400).json({ message: "Membership ID/email and password are required" });
  }
  db.query(
    "SELECT id, full_name AS fullName, membership_id AS membershipId, email, role FROM users WHERE (membership_id=? OR email=? ) AND password_hash=?",
    [identifier.trim(), identifier.trim(), password],
    (error, users) => {
      if (error) return res.status(500).json({ message: "Login failed", error: error.message });
      if (!users.length) return res.status(401).json({ message: "Invalid login details" });
      res.json({ message: "Login successful", user: users[0] });
    }
  );
});

module.exports = router;
