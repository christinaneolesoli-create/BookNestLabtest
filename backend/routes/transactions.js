const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  db.query(
    `SELECT t.id, t.user_id AS userId, t.book_id AS bookId,
      t.transaction_type AS transactionType, t.quantity,
      t.transaction_date AS transactionDate, t.due_date AS dueDate,
      b.title AS bookTitle, u.full_name AS userName
     FROM transactions t
     JOIN books b ON b.id=t.book_id
     JOIN users u ON u.id=t.user_id
     ORDER BY t.transaction_date DESC, t.id DESC`,
    (error, transactions) => {
      if (error) return res.status(500).json({ message: "Failed to retrieve transactions", error: error.message });
      res.json(transactions);
    }
  );
});

router.post("/", (req, res) => {
  const { bookId, userId, type, quantity = 1, dueDate = null } = req.body;
  const normalizedType = String(type).toUpperCase();
  const amount = Number(quantity);

  if (!Number.isInteger(amount) || amount < 1 || !bookId || !userId ||
      !["BORROW", "RETURN", "ADD_STOCK"].includes(normalizedType)) {
    return res.status(400).json({ message: "Invalid transaction details" });
  }

  db.beginTransaction((beginError) => {
    if (beginError) return res.status(500).json({ message: "Could not start transaction", error: beginError.message });

    db.query("SELECT available_quantity, total_quantity FROM books WHERE id=? FOR UPDATE",
      [bookId], (stockError, books) => {
        if (stockError || !books.length) {
          return db.rollback(() => res.status(stockError ? 500 : 404).json({
            message: stockError ? "Could not read stock" : "Book not found",
            error: stockError?.message,
          }));
        }

        const book = books[0];
        let newAvailable = Number(book.available_quantity);
        let newTotal = Number(book.total_quantity);

        if (normalizedType === "BORROW") newAvailable -= amount;
        if (normalizedType === "RETURN") newAvailable += amount;
        if (normalizedType === "ADD_STOCK") {
          newAvailable += amount;
          newTotal += amount;
        }

        if (newAvailable < 0 || newAvailable > newTotal) {
          return db.rollback(() => res.status(400).json({
            message: normalizedType === "BORROW"
              ? "Not enough copies available"
              : "Invalid stock quantity",
          }));
        }

        db.query("UPDATE books SET total_quantity=?, available_quantity=? WHERE id=?",
          [newTotal, newAvailable, bookId], (updateError) => {
            if (updateError) {
              return db.rollback(() => res.status(500).json({ message: "Failed to update stock", error: updateError.message }));
            }

            const recordType = normalizedType === "ADD_STOCK" ? "RETURN" : normalizedType;
            db.query(
              "INSERT INTO transactions (user_id, book_id, transaction_type, quantity, due_date) VALUES (?, ?, ?, ?, ?)",
              [userId, bookId, recordType, amount, dueDate || null],
              (insertError, result) => {
                if (insertError) {
                  return db.rollback(() => res.status(500).json({ message: "Failed to record transaction", error: insertError.message }));
                }
                db.commit((commitError) => {
                  if (commitError) return db.rollback(() => res.status(500).json({ message: "Could not commit transaction", error: commitError.message }));
                  res.status(201).json({
                    id: result.insertId,
                    bookId: Number(bookId),
                    userId: Number(userId),
                    transactionType: recordType,
                    quantity: amount,
                    dueDate,
                    message: normalizedType === "ADD_STOCK" ? "Stock added" : "Transaction recorded",
                  });
                });
              }
            );
          });
      });
  });
});

module.exports = router;
