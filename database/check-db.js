
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
  path.join(__dirname, "librobot.db")
);

const books = db.prepare(
  "SELECT COUNT(*) AS total FROM books"
).get();

const members = db.prepare(
  "SELECT COUNT(*) AS total FROM members"
).get();

const loans = db.prepare(
  "SELECT COUNT(*) AS total FROM loans"
).get();

console.log("Database verification");
console.log("---------------------");
console.log("Books:", books.total);
console.log("Members:", members.total);
console.log("Loans:", loans.total);

const availableBooks = db.prepare(`
  SELECT title, author, available_copies
  FROM books
  WHERE title LIKE ?
`).all("%Wings of Fire%");

console.log("\nSearch test:");
console.log(availableBooks);

db.close();
