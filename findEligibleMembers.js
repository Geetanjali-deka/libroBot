
const Database = require("better-sqlite3");

const db = new Database("./database/librobot.db", {
  readonly: true,
});

const members = db.prepare(`
  SELECT
    m.member_id,
    m.name,
    m.max_books,
    SUM(
      CASE WHEN l.return_date IS NULL THEN 1 ELSE 0 END
    ) AS active_loans,
    SUM(
      CASE
        WHEN l.return_date IS NULL
         AND l.due_date < date('now')
        THEN 1 ELSE 0
      END
    ) AS overdue_loans,
    (
      SELECT COALESCE(SUM(fine_amount), 0)
      FROM loans
      WHERE member_id = m.member_id
        AND fine_paid = 0
    ) AS unpaid_fines
  FROM members m
  LEFT JOIN loans l ON l.member_id = m.member_id
  GROUP BY m.member_id
  HAVING active_loans < m.max_books
     AND unpaid_fines <= 100
  ORDER BY overdue_loans, active_loans
`).all();

console.table(members);
db.close();
