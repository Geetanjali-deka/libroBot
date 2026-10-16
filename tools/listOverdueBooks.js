
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(
  __dirname,
  "..",
  "database",
  "librobot.db"
);

function listOverdueBooks() {
  let db;

  try {
    // Open the library database in read-only mode.
    db = new Database(dbPath, {
      readonly: true,
    });

    // Find active loans whose due dates have passed.
    const overdueBooks = db.prepare(`
      SELECT
        l.loan_id,
        l.member_id,
        m.name AS member_name,
        b.title,
        b.author,
        l.issue_date,
        l.due_date,

        CAST(
          julianday(date('now')) -
          julianday(date(l.due_date))
          AS INTEGER
        ) AS late_days,

        CAST(
          julianday(date('now')) -
          julianday(date(l.due_date))
          AS INTEGER
        ) * 5 AS estimated_fine

      FROM loans l

      JOIN books b
        ON l.book_id = b.book_id

      JOIN members m
        ON l.member_id = m.member_id

      WHERE
        l.return_date IS NULL
        AND date(l.due_date) < date('now')

      ORDER BY l.due_date ASC
    `).all();

    // Calculate the total estimated fine in the database tool.
    const totalEstimatedFine = overdueBooks.reduce(
      (total, book) =>
        total + Number(book.estimated_fine || 0),
      0
    );

    return {
      success: true,

      total_overdue: overdueBooks.length,

      total_estimated_fine: totalEstimatedFine,

      overdue_books: overdueBooks,

      message:
        `Found ${overdueBooks.length} overdue book loan(s).`,
    };

  } catch (error) {
    console.error(
      "Could not list overdue books:",
      error.message
    );

    return {
      success: false,
      message:
        "Could not retrieve overdue books. Please try again.",
    };

  } finally {
    // Always close the database connection.
    if (db) {
      db.close();
    }
  }
}

module.exports = listOverdueBooks;

