
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const booksRouter = require("./routes/books");
const usersRouter = require("./routes/users");
const transactionsRouter = require("./routes/transactions");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/books", booksRouter);
app.use("/api/users", usersRouter);
app.use("/api/transactions", transactionsRouter);

app.get("/", (req, res) => {
  res.send("BookNest API is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BookNest server running on port ${PORT}`);
});
