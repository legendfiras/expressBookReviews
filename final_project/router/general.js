const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User successfully registered" });
});

// Helper endpoint so Axios has something to call (returns ALL books)
public_users.get('/books', (req, res) => {
  return res.status(200).json(books);
});

// Get the book list available in the shop USING Axios + async/await
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/books');
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching books" });
  }
});

// Helper endpoint for Axios to fetch SINGLE book by ISBN
public_users.get('/books/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  if (books[isbn]) {
    return res.status(200).json(books[isbn]);
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

// Get book details based on ISBN USING Axios + async/await
public_users.get('/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;

  try {
    const response = await axios.get(`http://localhost:5000/books/${isbn}`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(404).json({ message: "Book not found" });
  }
});

// Helper endpoint for Axios to fetch books by author
public_users.get('/books/author/:author', (req, res) => {
  const author = req.params.author;
  const keys = Object.keys(books);
  let result = [];

  keys.forEach(key => {
    if (books[key].author === author) {
      result.push(books[key]);
    }
  });

  if (result.length > 0) {
    return res.status(200).json(result);
  } else {
    return res.status(404).json({ message: "No books found for this author" });
  }
});

// Get book details based on author USING Axios + async/await
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;

  try {
    const response = await axios.get(`http://localhost:5000/books/author/${author}`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(404).json({ message: "No books found for this author" });
  }
});

// Helper endpoint for Axios to fetch books by title
public_users.get('/books/title/:title', (req, res) => {
  const title = req.params.title;
  const keys = Object.keys(books);
  let result = [];

  keys.forEach(key => {
    if (books[key].title === title) {
      result.push(books[key]);
    }
  });

  if (result.length > 0) {
    return res.status(200).json(result);
  } else {
    return res.status(404).json({ message: "No books found with this title" });
  }
});

// Get book details based on Title USING Axios + async/await
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title;

  try {
    const response = await axios.get(`http://localhost:5000/books/title/${title}`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(404).json({ message: "No books found with this title" });
  }
});

// Get book review
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;