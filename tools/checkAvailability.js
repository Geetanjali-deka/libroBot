
const Database = require("better-sqlite3");
const path = require("path");

// Connect to the LibroBot database
const dbPath = path.join(
  __dirname,
  "..",
  "database",
  "librobot.db"
);

const db = new Database(dbPath);

// Check whether a book is available
function checkAvailability(bookTitle) {
  try {
    // Find the requested book
    const findBook = db.prepare(`
      SELECT book_id, title, author, genre, available_copies
      FROM books
      WHERE title LIKE ?
      ORDER BY title
      LIMIT 1
    `);

    const book = findBook.get(`%${bookTitle}%`);

    // If the book does not exist
    if (!book) {
      return {
        found: false,
        message: `Sorry, I could not find "${bookTitle}" in the library.`
      };
    }

    // If at least one copy is available
    if (book.available_copies > 0) {
      return {
        found: true,
        available: true,
        title: book.title,
        author: book.author,
        available_copies: book.available_copies,
        message: `"${book.title}" is available to borrow.`
      };
    }

    // Find other available books in the same genre
    const findAlternatives = db.prepare(`
      SELECT title, author, available_copies
      FROM books
      WHERE genre = ?
        AND book_id != ?
        AND available_copies > 0
      LIMIT 3
    `);

    const alternatives = findAlternatives.all(
      book.genre,
      book.book_id
    );

    return {
      found: true,
      available: false,
      title: book.title,
      author: book.author,
      available_copies: 0,
      alternatives,
      message: `"${book.title}" is currently unavailable.`
    };

  } catch (error) {
    console.error("Availability check failed:", error.message);

    return {
      error: true,
      message: "Sorry, I could not check availability right now."
    };
  }
}

// Make the function available to other files
module.exports = checkAvailability;
