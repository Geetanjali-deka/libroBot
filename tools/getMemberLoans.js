
const Database = require("better-sqlite3");
const path = require("path");

// Connect to the LibroBot database.
const dbPath = path.join(
  __dirname,
  "..",
  "database",
  "librobot.db"
);

const db = new Database(dbPath);

function getMemberLoans(memberId) {
  try {
    // Check whether the member exists.
    const member = db.prepare(`
      SELECT member_id, name
      FROM members
      WHERE member_id = ?
    `).get(memberId);

    if (!member) {
      return {
        success: false,
        message: `Member ${memberId} was not found.`
      };
    }

    // Retrieve the member's borrowing history.
    const loans = db.prepare(`
      SELECT
        loans.loan_id,
        books.title,
        books.author,
        loans.issue_date,
        loans.due_date,
        loans.return_date,
        loans.fine_amount,
        loans.fine_paid
      FROM loans
      JOIN books ON loans.book_id = books.book_id
      WHERE loans.member_id = ?
      ORDER BY loans.issue_date DESC
    `).all(memberId);

    const today = new Date().toISOString().slice(0, 10);

    // Calculate current estimated fines for active overdue loans.
    const formattedLoans = loans.map((loan) => {
      const isActive = loan.return_date === null;
      const isOverdue = isActive && loan.due_date < today;

      let estimatedFine = loan.fine_amount;

      if (isOverdue) {
        const dueTime = Date.parse(`${loan.due_date}T00:00:00Z`);
        const todayTime = Date.parse(`${today}T00:00:00Z`);

        const lateDays = Math.max(
          0,
          Math.floor(
            (todayTime - dueTime) / (1000 * 60 * 60 * 24)
          )
        );

        estimatedFine = lateDays * 5;
      }

      let status = "Returned";

      if (isActive) {
        status = isOverdue ? "Overdue" : "Borrowed";
      }

      return {
        ...loan,
        status,
        fine_paid: Boolean(loan.fine_paid),
        estimated_fine: estimatedFine
      };
    });

    const activeLoans = formattedLoans.filter(
      (loan) => loan.return_date === null
    );

    const overdueLoans = formattedLoans.filter(
      (loan) => loan.status === "Overdue"
    );

    // Unpaid fines include stored fines on returned loans and
    // current estimates for active overdue loans.
    const unpaidFines = formattedLoans.reduce(
      (total, loan) => {
        if (loan.fine_paid) {
          return total;
        }

        return total + loan.estimated_fine;
      },
      0
    );

    return {
      success: true,
      member_id: member.member_id,
      member_name: member.name,
      total_loans: formattedLoans.length,
      active_loans: activeLoans.length,
      overdue_loans: overdueLoans.length,
      unpaid_fines: unpaidFines,
      loans: formattedLoans,
      message: `Found ${formattedLoans.length} loan records for ${member.name}.`
    };

  } catch (error) {
    console.error(
      "Could not retrieve member loans:",
      error.message
    );

    return {
      success: false,
      message: "Could not retrieve loan information. Please try again."
    };
  }
}

module.exports = getMemberLoans;
