
const Database = require("better-sqlite3");
const path = require("path");

// Locate the database file
const dbPath = path.join(
  __dirname,
  "..",
  "database",
  "librobot.db"
);

// Open the database connection
const db = new Database(dbPath);

// Function to search for books
function searchBooks(keyword) {
  try {
    // Prepare a query to search titles, authors, and genres
    const query = db.prepare(`
      SELECT
        book_id,
        title,
        author,
        genre,
        total_copies,
        available_copies
      FROM books
      WHERE title LIKE ?
         OR author LIKE ?
         OR genre LIKE ?
    `);

    // Add wildcards to allow partial matches
    const searchTerm = `%${keyword}%`;

    // Run the query and return matching books
    return query.all(
      searchTerm,
      searchTerm,
      searchTerm
    );
  } catch (error) {
    console.error("Book search failed:", error.message);
    return [];
  }
}

// Export the function for use in other files
module.exports = searchBooks;