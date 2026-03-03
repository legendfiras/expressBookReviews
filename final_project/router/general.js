const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

/**
 * POST /register
 * Registers a new user.
 * - Validates required fields
 * - Checks if username already exists using isValid()
 */
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

/**
 * GET /books  (Helper endpoint)
 * This endpoint returns the full "books" object from booksdb.js.
 * We use it as a local data source that Axios can call.
 */
public_users.get('/books', (req, res) => {
  return res.status(200).json(books);
});

/**
 * GET /
 * Retrieves ALL books using Axios + async/await.
 * - Calls the helper endpoint /books
 * - Returns the full books object
 */
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/books');
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching books" });
  }
});

/**
 * GET /books/:isbn  (Helper endpoint)
 * Returns a SINGLE book by ISBN directly from the in-memory books object.
 * This is used by Axios calls in other routes.
 */
public_users.get('/books/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  if (books[isbn]) {
    return res.status(200).json(books[isbn]);
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

/**
 * GET /isbn/:isbn
 * Retrieves a SINGLE book using Axios + async/await.
 * - Calls /books/:isbn (helper)
 * - Returns book details (author, title, reviews)
 */
public_users.get('/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;

  try {
    const response = await axios.get(`http://localhost:5000/books/${isbn}`);
    return res.status(200).json(response.data);
  } catch (error) {
    // Keep response consistent + informative
    return res.status(404).json({ message: "Book not found", isbn });
  }
});

/**
 * GET /books/author/:author  (Helper endpoint)
 * Filters ALL books by author name.
 *
 * How filtering works:
 * - books is an object: { "1": {author,title,reviews}, "2": {...}, ... }
 * - We loop over all keys (ISBNs)
 * - We push matching books into an array
 * - We return:
 *    200 + array of matching books, OR
 *    404 if none found
 */
public_users.get('/books/author/:author', (req, res) => {
  const author = req.params.author;
  const keys = Object.keys(books);
  let result = [];

  keys.forEach((key) => {
    if (books[key].author === author) {
      result.push(books[key]);
    }
  });

  if (result.length > 0) {
    return res.status(200).json(result);
  } else {
    return res.status(404).json({ message: "No books found for this author", author });
  }
});

/**
 * GET /author/:author
 * Retrieves books by author using Axios + async/await.
 * - Calls /books/author/:author (helper)
 * - Returns an array of matching books
 *
 * Note: We encode the author to support spaces and special characters.
 * Example: "Jane Austen" -> "Jane%20Austen"
 */
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;

  try {
    const encodedAuthor = encodeURIComponent(author);
    const response = await axios.get(`http://localhost:5000/books/author/${encodedAuthor}`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(404).json({ message: "No books found for this author", author });
  }
});

/**
 * GET /books/title/:title  (Helper endpoint)
 * Filters ALL books by exact title match.
 * Returns:
 * - 200 + array of matching books
 * - 404 if none found
 */
public_users.get('/books/title/:title', (req, res) => {
  const title = req.params.title;
  const keys = Object.keys(books);
  let result = [];

  keys.forEach((key) => {
    if (books[key].title === title) {
      result.push(books[key]);
    }
  });

  if (result.length > 0) {
    return res.status(200).json(result);
  } else {
    return res.status(404).json({ message: "No books found with this title", title });
  }
});

/**
 * GET /title/:title
 * Retrieves books by title using Axios + async/await.
 * - Calls /books/title/:title (helper)
 * - Returns an array of matching books
 *
 * Note: We encode the title to support spaces and special characters.
 */
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title;

  try {
    const encodedTitle = encodeURIComponent(title);
    const response = await axios.get(`http://localhost:5000/books/title/${encodedTitle}`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(404).json({ message: "No books found with this title", title });
  }
});

/**
 * GET /review/:isbn
 * Returns ONLY the reviews object for a given ISBN.
 * If there are no reviews yet, it returns {} (empty object).
 *
 * Improvement: return JSON directly (no manual JSON.stringify needed).
 */
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  if (books[isbn]) {
    // Always return JSON for consistency
    return res.status(200).json(books[isbn].reviews);
  } else {
    return res.status(404).json({ message: "Book not found", isbn });
  }
});

module.exports.general = public_users;
