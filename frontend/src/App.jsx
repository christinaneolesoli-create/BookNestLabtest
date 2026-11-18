import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

const API = "http://localhost:5000/api";

function StatCard({ title, value, detail }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h2>{value}</h2>
      <small>{detail}</small>
    </div>
  );
}

function UsersPage({ users, setUsers, setMessage }) {
  const empty = { fullName: "", membershipId: "", email: "", password: "", role: "MEMBER" };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [login, setLogin] = useState({ identifier: "", password: "" });

  function change(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  function reset() {
    setForm(empty);
    setEditingId(null);
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const payload = { ...form, fullName: form.fullName.trim(),
        membershipId: form.membershipId.trim(), email: form.email.trim() };
      const response = await fetch(`${API}/users${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "User operation failed");
      setUsers((previous) => editingId
        ? previous.map((user) => user.id === editingId ? data : user)
        : [data, ...previous]);
      setMessage(editingId ? "User updated successfully." : "User added successfully.");
      reset();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function edit(user) {
    setEditingId(user.id);
    setForm({ fullName: user.fullName, membershipId: user.membershipId || "",
      email: user.email || "", password: "", role: user.role || "MEMBER" });
  }

  async function remove(id) {
    if (!window.confirm("Delete this user?")) return;
    try {
      const response = await fetch(`${API}/users/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete user");
      setUsers((previous) => previous.filter((user) => user.id !== id));
      if (editingId === id) reset();
      setMessage("User deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loginSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      setMessage(`Login successful: ${data.user.fullName}`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="users-layout">
      <section className="content-card">
        <h2>User Login</h2><p className="card-subtitle">Use membership ID or email</p>
        <form className="book-form" onSubmit={loginSubmit}>
          <label>Membership ID / Email
            <input value={login.identifier} onChange={(event) => setLogin((p) => ({ ...p, identifier: event.target.value }))} required />
          </label>
          <label>Password
            <input type="password" value={login.password} onChange={(event) => setLogin((p) => ({ ...p, password: event.target.value }))} required />
          </label>
          <div className="form-actions"><button className="primary-button" type="submit">Login</button></div>
        </form>
      </section>

      <section className="content-card">
        <h2>User Management</h2><p className="card-subtitle">Add, update and remove library users</p>
        <form className="book-form" onSubmit={submit}>
          <label>Full Name<input name="fullName" value={form.fullName} onChange={change} required /></label>
          <label>Membership ID<input name="membershipId" value={form.membershipId} onChange={change} required /></label>
          <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>
          <label>Password<input type="password" name="password" value={form.password} onChange={change} /></label>
          <label>Role<select name="role" value={form.role} onChange={change}>
            <option value="MEMBER">Member</option><option value="ADMIN">Admin</option>
          </select></label>
          <div className="form-actions">
            <button className="primary-button" type="submit">{editingId ? "Update User" : "Add User"}</button>
            {editingId && <button className="secondary-button" type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Membership ID</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}><td>{user.fullName}</td><td>{user.membershipId || "-"}</td><td>{user.email}</td>
                <td>{user.role}</td><td><div className="action-buttons">
                  <button className="edit-button" type="button" onClick={() => edit(user)}>Edit</button>
                  <button className="delete-button" type="button" onClick={() => remove(user.id)}>Delete</button>
                </div></td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/books`).then((response) => response.json()),
      fetch(`${API}/users`).then((response) => response.json()),
      fetch(`${API}/transactions`).then((response) => response.json()),
    ]).then(([bookData, userData, transactionData]) => {
      setBooks(Array.isArray(bookData) ? bookData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      setTransactions(Array.isArray(transactionData) ? transactionData : []);
    }).catch((error) => setMessage(error.message));
  }, []);

  const navigation = [
    { label: "Dashboard", to: "/" },
    { label: "Books", to: "/books" },
    { label: "Transactions", to: "/transactions" },
    { label: "Users", to: "/users" },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand"><h2>BookNest</h2></div>
        <p className="sidebar-label menu-label">MENU</p>
        <nav>{navigation.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => `nav-link nav-item ${isActive ? "active" : ""}`}>
            {item.label}
          </NavLink>
        ))}</nav>
        <div className="sidebar-profile sidebar-bottom"><div><strong>Administrator</strong><small>Library Admin</small></div></div>
      </aside>
      <main className="main-content">
        {message && <p className={`app-message ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("invalid") || message.toLowerCase().includes("cannot") || message.toLowerCase().includes("not enough") ? "error" : "success"}`}>{message}</p>}
        <header className="topbar"><div><h1>BookNest Library</h1><p>Manage your library with ease.</p></div><div className="admin-badge">Administrator</div></header>
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<Dashboard books={books} transactions={transactions} />} />
            <Route path="/books" element={<BooksPage books={books} setBooks={setBooks} setMessage={setMessage} />} />
            <Route path="/transactions" element={<TransactionsPage books={books} setBooks={setBooks} users={users}
              transactions={transactions} setTransactions={setTransactions} setMessage={setMessage} />} />
            <Route path="/users" element={<UsersPage users={users} setUsers={setUsers} setMessage={setMessage} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Dashboard({ books, transactions }) {
  const totalCopies = books.reduce((sum, book) => sum + Number(book.totalQuantity), 0);
  const availableCopies = books.reduce((sum, book) => sum + Number(book.availableQuantity), 0);
  const lowStock = books.filter((book) => Number(book.availableQuantity) < 2);

  return (
    <>
      <section className="stats-grid">
        <StatCard title="Total Titles" value={books.length} detail="Books in the library" />
        <StatCard title="Total Copies" value={totalCopies} detail="All book copies" />
        <StatCard title="Available Copies" value={availableCopies} detail="Ready to borrow" />
        <StatCard title="Low Stock Titles" value={lowStock.length} detail="Fewer than 2 available" />
      </section>

      <section className="dashboard-grid">
        <div className="content-card">
          <div className="section-heading">
            <div><h2>Book Inventory</h2><p>Overview of your library collection</p></div>
            <NavLink className="primary-button" to="/books">Manage Books</NavLink>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Book Title</th><th>Author</th><th>Genre</th><th>ISBN</th><th>Total</th><th>Available</th></tr></thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className={Number(book.availableQuantity) < 2 ? "low-stock-row" : ""}>
                    <td>{book.title}</td><td>{book.author}</td><td>{book.genre}</td><td>{book.isbn || "-"}</td>
                    <td>{book.totalQuantity}</td><td>{book.availableQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="content-card">
          <h2>Library Summary</h2><p className="card-subtitle">Current collection status</p>
          <div className="summary-row"><span>Total copies</span><strong>{totalCopies}</strong></div>
          <div className="summary-row"><span>Available</span><strong>{availableCopies}</strong></div>
          <div className="summary-row"><span>Borrowed</span><strong>{totalCopies - availableCopies}</strong></div>
          <div className="summary-row"><span>Low stock titles</span><strong>{lowStock.length}</strong></div>
        </div>
      </section>

      <section className="content-card recent-card">
        <h2>Recent Transactions</h2><p className="card-subtitle">Latest library activity</p>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Book</th><th>Member</th><th>Transaction</th><th>Date</th></tr></thead>
            <tbody>
              {transactions.slice(0, 8).map((item) => (
                <tr key={item.id}>
                  <td>{item.bookTitle}</td><td>{item.userName}</td>
                  <td><span className={`status ${item.transactionType === "BORROW" ? "borrowed" : "returned"}`}>
                    {item.transactionType === "BORROW" ? "Borrowed" : "Returned"}
                  </span></td>
                  <td>{new Date(item.transactionDate).toLocaleDateString()}</td>
                </tr>
              ))}
              {!transactions.length && <tr><td colSpan="4">No transactions recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AddBookForm({ editingId, bookForm, onChange, onSubmit, onCancel }) {
  return (
    <form className="book-form" onSubmit={onSubmit}>
      <label>Book Title<input name="title" value={bookForm.title} onChange={onChange} required /></label>
      <label>Author<input name="author" value={bookForm.author} onChange={onChange} required /></label>
      <label>Genre<input name="genre" value={bookForm.genre} onChange={onChange} required /></label>
      <label>ISBN<input name="isbn" value={bookForm.isbn} onChange={onChange} /></label>
      <label>Total Quantity<input type="number" min="0" name="totalQuantity" value={bookForm.totalQuantity} onChange={onChange} required /></label>
      <label>Available Quantity<input type="number" min="0" name="availableQuantity" value={bookForm.availableQuantity} onChange={onChange} required /></label>
      <div className="form-actions">
        <button className="primary-button" type="submit">{editingId ? "Update Book" : "Add Book"}</button>
        {editingId && <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function BooksPage({ books, setBooks, setMessage }) {
  const empty = { title: "", author: "", genre: "", isbn: "", totalQuantity: "", availableQuantity: "" };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  function change(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  function reset() {
    setForm(empty);
    setEditingId(null);
  }

  async function submit(event) {
    event.preventDefault();
    const totalQuantity = Number(form.totalQuantity);
    const availableQuantity = Number(form.availableQuantity);
    if (availableQuantity > totalQuantity) {
      setMessage("Available copies cannot exceed total copies.");
      return;
    }
    const payload = { ...form, title: form.title.trim(), author: form.author.trim(),
      genre: form.genre.trim(), isbn: form.isbn.trim() || null, totalQuantity, availableQuantity };
    try {
      const response = await fetch(`${API}/books${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Book operation failed");
      setBooks((previous) => editingId
        ? previous.map((book) => book.id === editingId ? data : book)
        : [data, ...previous]);
      setMessage(editingId ? "Book updated successfully." : "Book added successfully.");
      reset();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function edit(book) {
    setEditingId(book.id);
    setForm({ title: book.title, author: book.author, genre: book.genre, isbn: book.isbn || "",
      totalQuantity: String(book.totalQuantity), availableQuantity: String(book.availableQuantity) });
  }

  async function remove(id) {
    if (!window.confirm("Delete this book?")) return;
    try {
      const response = await fetch(`${API}/books/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete book");
      setBooks((previous) => previous.filter((book) => book.id !== id));
      if (editingId === id) reset();
      setMessage("Book deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  const filtered = books.filter((book) =>
    `${book.title} ${book.author} ${book.genre} ${book.isbn || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="content-card">
      <div className="section-heading"><div><h2>Book Management</h2><p>Add, update, search and remove books</p></div></div>
      <AddBookForm editingId={editingId} bookForm={form} onChange={change} onSubmit={submit} onCancel={reset} />
      <div className="section-heading books-heading">
        <h2>All Books ({filtered.length})</h2>
        <input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search books..." />
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Book Title</th><th>Author</th><th>Genre</th><th>ISBN</th><th>Total</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td><td>{book.author}</td><td>{book.genre}</td><td>{book.isbn || "-"}</td>
              <td>{book.totalQuantity}</td><td>{book.availableQuantity}</td>
              <td><div className="action-buttons">
                <button className="edit-button" type="button" onClick={() => edit(book)}>Edit</button>
                <button className="delete-button" type="button" onClick={() => remove(book.id)}>Delete</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function TransactionsPage({ books, setBooks, users, transactions, setTransactions, setMessage }) {
  const [form, setForm] = useState({ bookId: "", userId: "", type: "BORROW", quantity: "1", dueDate: "" });
  function change(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  async function record(event) {
    event.preventDefault();
    try {
      const payload = { ...form, bookId: Number(form.bookId), userId: Number(form.userId),
        quantity: Number(form.quantity), dueDate: form.dueDate || null };
      const response = await fetch(`${API}/transactions`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Transaction failed");
      setTransactions((previous) => [{ ...data,
        bookTitle: books.find((book) => book.id === payload.bookId)?.title,
        userName: users.find((user) => user.id === payload.userId)?.fullName,
        transactionDate: new Date().toISOString(),
      }, ...previous]);
      setBooks((previous) => previous.map((book) => {
        if (book.id !== payload.bookId) return book;
        let available = Number(book.availableQuantity);
        let total = Number(book.totalQuantity);
        if (payload.type === "BORROW") available -= payload.quantity;
        if (payload.type === "RETURN") available += payload.quantity;
        if (payload.type === "ADD_STOCK") { available += payload.quantity; total += payload.quantity; }
        return { ...book, availableQuantity: available, totalQuantity: total };
      }));
      setMessage("Stock transaction recorded successfully.");
      setForm({ bookId: "", userId: "", type: "BORROW", quantity: "1", dueDate: "" });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="content-card">
      <h2>Transactions</h2><p className="card-subtitle">Add stock, borrow or return books</p>
      <form className="book-form" onSubmit={record}>
        <label>Book<select name="bookId" value={form.bookId} onChange={change} required>
          <option value="">Select a book</option>{books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
        </select></label>
        <label>User<select name="userId" value={form.userId} onChange={change} required>
          <option value="">Select a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
        </select></label>
        <label>Transaction<select name="type" value={form.type} onChange={change}>
          <option value="BORROW">Borrow / Deduct stock</option><option value="RETURN">Return</option><option value="ADD_STOCK">Add stock</option>
        </select></label>
        <label>Quantity<input type="number" min="1" name="quantity" value={form.quantity} onChange={change} required /></label>
        <label>Due Date (optional)<input type="date" name="dueDate" value={form.dueDate} onChange={change} /></label>
        <div className="form-actions"><button className="primary-button" type="submit">Record Transaction</button></div>
      </form>
      <div className="table-wrapper transaction-history">
        <table>
          <thead><tr><th>Date</th><th>Book</th><th>Member</th><th>Type</th><th>Quantity</th></tr></thead>
          <tbody>{transactions.map((item) => (
            <tr key={item.id}><td>{new Date(item.transactionDate).toLocaleString()}</td><td>{item.bookTitle}</td><td>{item.userName}</td>
              <td><span className={`status ${item.transactionType === "BORROW" ? "borrowed" : "returned"}`}>{item.transactionType}</span></td>
              <td>{item.quantity}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
