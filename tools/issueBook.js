
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(
  __dirname,
  "..",
  "database",
  "librobot.db"
);

const db = new Database(dbPath);

// Add 14 days to a date
function addDays(date, numberOfDays) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + numberOfDays);
  return result.toISOString().slice(0, 10);
}

function issueBook(memberId, bookTitle, confirmed = false) {
  try {
    // Require confirmation before changing the database
    if (!confirmed) {
      return {
        success: false,
        requires_confirmation: true,
        message: `Please confirm that you want to issue "${bookTitle}" to member ${memberId}.`
      };
    }

    // Find the member
    const member = db.prepare(`
      SELECT member_id, name, max_books
      FROM members
      WHERE member_id = ?
    `).get(memberId);

    if (!member) {
      return {
        success: false,
        message: `Member ${memberId} was not found.`
      };
    }

    // Find the book
    const book = db.prepare(`
  SELECT *
  FROM books
  WHERE LOWER(REPLACE(title, ' ', '')) =
        LOWER(REPLACE(?, ' ', ''))
  LIMIT 1
`).get(bookTitle.trim());


    if (!book) {
      return {
        success: false,
        message: `Book "${bookTitle}" was not found.`
      };
    }

    // Check the available copies
    if (book.available_copies < 1) {
      return {
        success: false,
        message: `"${book.title}" has no available copies.`
      };
    }

    // Check for an existing active loan of the same book
    const duplicateLoan = db.prepare(`
      SELECT loan_id
      FROM loans
      WHERE member_id = ?
        AND book_id = ?
        AND return_date IS NULL
    `).get(memberId, book.book_id);

    if (duplicateLoan) {
      return {
        success: false,
        message: `Member ${memberId} has already borrowed "${book.title}" and has not returned it.`
      };
    }

    // Count the member's active loans
    const activeLoans = db.prepare(`
      SELECT COUNT(*) AS total
      FROM loans
      WHERE member_id = ?
        AND return_date IS NULL
    `).get(memberId);

    if (activeLoans.total >= member.max_books) {
      return {
        success: false,
        message: `${member.name} has reached the borrowing limit of ${member.max_books} books.`
      };
    }

    // Calculate the member's unpaid fines
    const fines = db.prepare(`
      SELECT COALESCE(SUM(fine_amount), 0) AS total
      FROM loans
      WHERE member_id = ?
        AND fine_paid = 0
    `).get(memberId);

    if (fines.total > 100) {
      return {
        success: false,
        message: `Borrowing blocked. ${member.name} has ₹${fines.total} in unpaid fines, exceeding the ₹100 limit.`
      };
    }

    // Prepare the loan dates
    const issueDate = new Date().toISOString().slice(0, 10);
    const dueDate = addDays(issueDate, 14);

    // Insert the loan and update available copies together
    const completeIssue = db.transaction(() => {
      const updateBook = db.prepare(`
        UPDATE books
        SET available_copies = available_copies - 1
        WHERE book_id = ?
          AND available_copies > 0
      `).run(book.book_id);

      if (updateBook.changes !== 1) {
        throw new Error("No copies are currently available.");
      }

      const newLoan = db.prepare(`
        INSERT INTO loans
        (book_id, member_id, issue_date, due_date)
        VALUES (?, ?, ?, ?)
      `).run(
        book.book_id,
        memberId,
        issueDate,
        dueDate
      );

      return newLoan.lastInsertRowid;
    });

    const loanId = completeIssue();

    return {
      success: true,
      loan_id: loanId,
      member: member.name,
      title: book.title,
      issue_date: issueDate,
      due_date: dueDate,
      message: `"${book.title}" has been issued to ${member.name}.`
    };

  } catch (error) {
    console.error("Book issuing failed:", error.message);

    return {
      success: false,
      message: "The book could not be issued. Please try again."
    };
  }
}

module.exports = issueBook;
