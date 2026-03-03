const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => { //returns boolean
  return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => { //returns boolean
  return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const accessToken = jwt.sign(
    { username },
    "fingerprint_customer",
    { expiresIn: "1h" }
  );

  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "User successfully logged in" });
});

// Add a book review (add OR modify)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;

  if (!review) {
    return res.status(400).json({ message: "Review is required in query string (?review=...)" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  const token = req.session.authorization?.accessToken;
  if (!token) {
    return res.status(403).json({ message: "User not logged in" });
  }

  let username;
  try {
    const decoded = jwt.verify(token, "fingerprint_customer");
    username = decoded.username;
  } catch (e) {
    return res.status(403).json({ message: "Invalid token" });
  }

  books[isbn].reviews[username] = review;

  return res.status(200).json({ message: "Review added/updated successfully" });
});

// Delete a book review (only the logged-in user's review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
  
    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }
  
    const username = req.session.authorization?.username;
    if (!username) {
      return res.status(403).json({ message: "User not logged in" });
    }
  
    if (!books[isbn].reviews || !books[isbn].reviews[username]) {
      return res.status(404).json({ message: "No review by this user for this ISBN" });
    }
  
    delete books[isbn].reviews[username];
  
    return res.status(200).json({ message: "Review deleted successfully" });
  });

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;