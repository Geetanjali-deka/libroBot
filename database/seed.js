
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const db = new Database(path.join(__dirname, "librobot.db"));

db.pragma("foreign_keys = ON");

// Create the tables using our schema file.
const schema = fs.readFileSync(
  path.join(__dirname, "schema.sql"),
  "utf8"
);

db.exec(schema);

// Clear old sample data so the seed can be run again.
db.exec(`
  DELETE FROM loans;
  DELETE FROM members;
  DELETE FROM books;
`);

const books = [
  ["Wings of Fire", "A.P.J. Abdul Kalam", "Biography", 3],
  ["Ignited Minds", "A.P.J. Abdul Kalam", "Biography", 2],
  ["The Discovery of India", "Jawaharlal Nehru", "History", 2],
  ["India After Gandhi", "Ramachandra Guha", "History", 2],
  ["The Alchemist", "Paulo Coelho", "Fiction", 3],
  ["The Guide", "R. K. Narayan", "Fiction", 2],
  ["Malgudi Days", "R. K. Narayan", "Fiction", 2],
  ["1984", "George Orwell", "Fiction", 2],
  ["The Hobbit", "J. R. R. Tolkien", "Fantasy", 2],
  ["Harry Potter and the Philosopher's Stone", "J. K. Rowling", "Fantasy", 2],
  ["The Lord of the Rings", "J. R. R. Tolkien", "Fantasy", 1],
  ["A Brief History of Time", "Stephen Hawking", "Science", 2],
  ["Cosmos", "Carl Sagan", "Science", 2],
  ["The Selfish Gene", "Richard Dawkins", "Science", 1],
  ["Clean Code", "Robert C. Martin", "Technology", 2],
  ["The Pragmatic Programmer", "Andrew Hunt", "Technology", 2],
  ["Introduction to Algorithms", "Thomas H. Cormen", "Technology", 1],
  ["JavaScript: The Good Parts", "Douglas Crockford", "Technology", 2],
  ["Atomic Habits", "James Clear", "Self-Help", 3],
  ["Deep Work", "Cal Newport", "Self-Help", 2],
  ["Think and Grow Rich", "Napoleon Hill", "Self-Help", 2],
  ["The Psychology of Money", "Morgan Housel", "Finance", 2],
  ["Rich Dad Poor Dad", "Robert Kiyosaki", "Finance", 2],
  ["Sapiens", "Yuval Noah Harari", "History", 2],
  ["The Diary of a Young Girl", "Anne Frank", "Biography", 2],
  ["Pride and Prejudice", "Jane Austen", "Classic", 2],
  ["To Kill a Mockingbird", "Harper Lee", "Classic", 2],
  ["The Silent Patient", "Alex Michaelides", "Mystery", 2],
  ["Sherlock Holmes", "Arthur Conan Doyle", "Mystery", 2],
  ["The Great Gatsby", "F. Scott Fitzgerald", "Classic", 2]
];

const insertBook = db.prepare(`
  INSERT INTO books
  (title, author, genre, total_copies, available_copies)
  VALUES (?, ?, ?, ?, ?)
`);

const bookIds = [];

for (const book of books) {
  const result = insertBook.run(
    book[0],
    book[1],
    book[2],
    book[3],
    book[3]
  );

  bookIds.push(result.lastInsertRowid);
}

const members = [
  ["M101", "Aarav Sharma", "aarav@example.com", "CSE"],
  ["M102", "Priya Verma", "priya@example.com", "BCA"],
  ["M103", "Rohan Singh", "rohan@example.com", "CSE"],
  ["M104", "Ananya Gupta", "ananya@example.com", "BCA"],
  ["M105", "Kabir Patel", "kabir@example.com", "IT"],
  ["M106", "Meera Joshi", "meera@example.com", "CSE"],
  ["M107", "Arjun Kumar", "arjun@example.com", "IT"],
  ["M108", "Isha Agarwal", "isha@example.com", "BCA"],
  ["M109", "Vivaan Mishra", "vivaan@example.com", "CSE"],
  ["M110", "Sana Khan", "sana@example.com", "IT"],
  ["M111", "Aditya Roy", "aditya@example.com", "BCA"],
  ["M112", "Neha Kapoor", "neha@example.com", "CSE"],
  ["M113", "Rahul Das", "rahul@example.com", "IT"],
  ["M114", "Kavya Nair", "kavya@example.com", "BCA"],
  ["M115", "Dev Malhotra", "dev@example.com", "CSE"]
];

const insertMember = db.prepare(`
  INSERT INTO members
  (member_id, name, email, department)
  VALUES (?, ?, ?, ?)
`);

for (const member of members) {
  insertMember.run(...member);
}

// Return a date in YYYY-MM-DD format.
function daysAgo(numberOfDays) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - numberOfDays);
  return date.toISOString().slice(0, 10);
}

function addDays(dateString, numberOfDays) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + numberOfDays);
  return date.toISOString().slice(0, 10);
}

// Each record: book number, member ID, issue age, return age.
// A null return age means the book has not been returned.
const loanData = [
  [1, "M102", 30, null],
  [2, "M103", 25, null],
  [3, "M104", 10, null],
  [5, "M105", 8, null],
  [6, "M106", 20, null],
  [7, "M107", 5, null],
  [9, "M108", 35, null],
  [12, "M109", 18, null],
  [15, "M110", 12, null],
  [19, "M111", 22, null],
  [1, "M101", 25, 5],
  [2, "M102", 20, 2],
  [4, "M103", 18, 1],
  [5, "M104", 10, 3],
  [8, "M105", 16, 0],
  [10, "M106", 12, 2],
  [13, "M107", 9, 4],
  [16, "M108", 8, 1],
  [20, "M109", 7, 2],
  [22, "M110", 15, 0]
];

const insertLoan = db.prepare(`
  INSERT INTO loans
  (book_id, member_id, issue_date, due_date,
   return_date, fine_amount, fine_paid)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const reduceAvailableCopies = db.prepare(`
  UPDATE books
  SET available_copies = available_copies - 1
  WHERE book_id = ? AND available_copies > 0
`);

const addSampleData = db.transaction(() => {
  for (const loan of loanData) {
    const [bookNumber, memberId, issueAge, returnAge] = loan;

    const issueDate = daysAgo(issueAge);
    const dueDate = addDays(issueDate, 14);

    const returnDate =
      returnAge === null ? null : daysAgo(returnAge);

    let fine = 0;

    if (returnDate !== null && returnDate > dueDate) {
      const lateDays = Math.floor(
        (Date.parse(returnDate) - Date.parse(dueDate)) /
        (1000 * 60 * 60 * 24)
      );

      fine = lateDays * 5;
    }

    insertLoan.run(
      bookIds[bookNumber - 1],
      memberId,
      issueDate,
      dueDate,
      returnDate,
      fine,
      0
    );

    // Only an active loan reduces the available stock.
    if (returnDate === null) {
      const result = reduceAvailableCopies.run(
        bookIds[bookNumber - 1]
      );

      if (result.changes !== 1) {
        throw new Error("Sample loan exceeds available copies.");
      }
    }
  }
});

try {
  addSampleData();

  console.log("LibroBot database created successfully!");
  console.log(`Books added: ${books.length}`);
  console.log(`Members added: ${members.length}`);
  console.log(`Loans added: ${loanData.length}`);
} catch (error) {
  console.error("Could not create sample data:", error.message);
} finally {
  db.close();
}
