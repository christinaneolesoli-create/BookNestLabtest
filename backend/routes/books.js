
const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all books
router.get("/", (req, res) => {
  const sql = `SELECT id, title, author, genre, isbn,
    total_quantity AS totalQuantity,
    available_quantity AS availableQuantity
    FROM books ORDER BY id DESC`;

  db.query(sql, (error, results) => {
    if (error) {
      return res.status(500).json({
        message: "Failed to retrieve books",
        error: error.message,
      });
    }

    res.json(results);
  });
});

router.post("/", (req, res) => {
  const { title, author, genre, isbn = null, totalQuantity = 0, availableQuantity } =
    req.body;
  const total = Number(totalQuantity);
  const available = availableQuantity === undefined ? total : Number(availableQuantity);

  if (!title?.trim() || !author?.trim() || !genre?.trim() ||
      !Number.isInteger(total) || total < 0 ||
      !Number.isInteger(available) || available < 0 || available > total) {
    return res.status(400).json({ message: "Invalid book details" });
  }

  const sql = `INSERT INTO books
    (title, author, genre, isbn, total_quantity, available_quantity)
    VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [title.trim(), author.trim(), genre.trim(), isbn, total, available],
    (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Failed to add book", error: error.message });
      }
      res.status(201).json({ id: result.insertId, title, author, genre, isbn,
        totalQuantity: total, availableQuantity: available });
    });
});

router.put("/:id", (req, res) => {
  const { title, author, genre, isbn = null, totalQuantity, availableQuantity } = req.body;
  const total = Number(totalQuantity);
  const available = Number(availableQuantity);

  if (!title?.trim() || !author?.trim() || !genre?.trim() ||
      !Number.isInteger(total) || total < 0 ||
      !Number.isInteger(available) || available < 0 || available > total) {
    return res.status(400).json({ message: "Invalid book details" });
  }

  const sql = `UPDATE books SET title = ?, author = ?, genre = ?, isbn = ?,
    total_quantity = ?, available_quantity = ? WHERE id = ?`;

  db.query(sql, [title.trim(), author.trim(), genre.trim(), isbn, total, available,
    req.params.id], (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Failed to update book", error: error.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json({ id: Number(req.params.id), title, author, genre, isbn,
        totalQuantity: total, availableQuantity: available });
    });
});

router.delete("/:id", (req, res) => {
  db.query("DELETE FROM books WHERE id = ?", [req.params.id], (error, result) => {
    if (error) {
      return res.status(500).json({ message: "Failed to delete book", error: error.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted" });
  });
});

module.exports = router;
