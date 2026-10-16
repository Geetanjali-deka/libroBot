
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

function returnBook(memberId, bookTitle, confirmed = false) {
  try {
    // Find the active loan for this member and book
    const findLoan = db.prepare(`
      SELECT
        loans.loan_id,
        loans.book_id,
        loans.member_id,
        loans.due_date,
        books.title
      FROM loans
      JOIN books ON loans.book_id = books.book_id
      WHERE loans.member_id = ?
        AND books.title LIKE ?
        AND loans.return_date IS NULL
      ORDER BY loans.loan_id
      LIMIT 1
    `);

    const loan = findLoan.get(
      memberId,
      `%${bookTitle}%`
    );

    // Check whether this member has borrowed the book
    if (!loan) {
      return {
        success: false,
        message: `No active loan was found for "${bookTitle}" under member ${memberId}.`
      };
    }

    // Ask for confirmation before changing the database
    if (!confirmed) {
      return {
        success: false,
        requires_confirmation: true,
        member_id: memberId,
        title: loan.title,
        due_date: loan.due_date,
        message: `Please confirm the return of "${loan.title}" for member ${memberId}.`
      };
    }

    // Get today's date in YYYY-MM-DD format
    const returnDate = new Date()
      .toISOString()
      .slice(0, 10);

    // Calculate the number of late days
    const dueTime = Date.parse(
      `${loan.due_date}T00:00:00Z`
    );

    const returnTime = Date.parse(
      `${returnDate}T00:00:00Z`
    );

    const lateDays = Math.max(
      0,
      Math.floor(
        (returnTime - dueTime) / (1000 * 60 * 60 * 24)
      )
    );

    // Charge ₹5 for each late day
    const fineAmount = lateDays * 5;

    // Update the loan and book together
    const completeReturn = db.transaction(() => {
      const updateLoan = db.prepare(`
        UPDATE loans
        SET return_date = ?,
            fine_amount = ?
        WHERE loan_id = ?
          AND return_date IS NULL
      `).run(
        returnDate,
        fineAmount,
        loan.loan_id
      );

      if (updateLoan.changes !== 1) {
        throw new Error("This loan has already been returned.");
      }

      db.prepare(`
        UPDATE books
        SET available_copies = available_copies + 1
        WHERE book_id = ?
      `).run(loan.book_id);
    });

    completeReturn();

    return {
      success: true,
      loan_id: loan.loan_id,
      title: loan.title,
      member_id: memberId,
      return_date: returnDate,
      due_date: loan.due_date,
      late_days: lateDays,
      fine_amount: fineAmount,
      fine_paid: false,
      message: lateDays > 0
        ? `"${loan.title}" has been returned. The late fine is ₹${fineAmount}.`
        : `"${loan.title}" has been returned on time. No fine is due.`
    };

  } catch (error) {
    console.error("Book return failed:", error.message);

    return {
      success: false,
      message: "The book could not be returned. Please try again."
    };
  }
}

module.exports = returnBook;
