# LibroBot — Acceptance Test Prompts

This document contains prompts for testing LibroBot, the Smart College Library Assistant. Run the prompts in the LibroBot terminal after starting the application with `npm start`.

## 1. Book Search

**Prompt:**
```text
Do you have any books by A.P.J. Abdul Kalam?
```

**Expected behavior:**
- Search the library database for books by the requested author.
- Display matching book titles and authors.
- Show availability information when available.
- Do not invent books that are not in the database.

**Status:** Passed during manual testing.

---

## 2. Book Availability

**Prompt:**
```text
Is The Hobbit available?
```

**Expected behavior:**
- Check the current database availability.
- Report whether the book can be borrowed.
- Do not claim that a book is available when no copies are available.

**Status:** Successfully verified during manual testing.

---

## 3. Issue a Book — Confirmation Required

**Prompt:**
```text
Issue The Hobbit to member M107.
```

**Expected behavior:**
- Check that the member and book exist.
- Check availability and the member's borrowing eligibility.
- Ask for confirmation before issuing the book.
- Do not issue the book before the member confirms.

**Cancellation test:**

When LibroBot asks for confirmation, enter:

```text
no
```

**Expected behavior:** Cancel the request without creating a loan or changing book availability.

**Status:** Confirmation and cancellation Successfully verified during manual testing.

---

## 4. Issue a Book — Duplicate Loan Prevention

**Prompt:**
```text
Issue Wings of Fire to member M102.
```

**Expected behavior:**
- Detect that M102 already has an active loan for *Wings of Fire*.
- Reject the duplicate loan.
- Do not create another loan record or change book availability.

**Status:** Successfully verified during manual testing.

---

## 5. Overdue Books Report

**Prompt:**
```text
Which books are overdue right now and who has them?
```

**Expected behavior:**
- List currently overdue loans.
- Display relevant book and member details.
- Calculate overdue days and fines using the configured rule of ₹5 per overdue day.
- Exclude returned books from the active overdue list.

**Status:** Passed during manual testing. Five overdue loans were reported in the test database.

---

## 6. Member Loan History and Outstanding Fines

**Prompt:**
```text
Show the loans for member M102.
```

**Expected behavior:**
- Display the member's loan history.
- Distinguish active loans from returned loans.
- Identify overdue active loans.
- Calculate estimated fines for active overdue loans.
- Report unpaid fines without incorrectly treating returned books as active loans.

**Status:** Tested manually. M102's current test data includes an active overdue loan and a returned loan with an unpaid fine.

---

## 7. Return a Book — Confirmation Required

**Prompt:**
```text
Member M107 is returning The Hobbit today.
```

**Expected behavior:**
- Find the matching active loan.
- Calculate the fine, if any, according to the configured rule.
- Ask for confirmation before recording the return.
- On confirmation, update the loan's return date and fine, and increase the book's available-copy count.
- On cancellation, leave the database unchanged.

**Status:** Successfully verified during manual testing.

---

## 8. Return a Book — Assessment Scenario

**Prompt:**
```text
M102 is returning loan L15 today. How much fine do they owe?
```

**Expected behavior:**
- Identify the exact loan referenced by the assessment.
- Calculate the fine using the configured due date and ₹5-per-day rule.
- Do not return a loan belonging to a different member.
- Do not modify a loan until the required confirmation is received.

**Data note:** In the current seeded database, loan ID 15 belongs to M105, while M102 has loan IDs 1 and 12. This scenario requires assessment data that matches the stated member and loan reference. Do not assume that loan 15 belongs to M102.

**Status:** Not passed with the current seeded data; requires data alignment.

---

## 9. Genre-Based Book Recommendations

**Prompt:**
```text
Suggest me something in the Mystery genre that is available.
```

**Expected behavior:**
- Search books in the requested genre.
- Recommend matching books that have available copies.
- Display relevant title, author, and availability details.
- Do not recommend unavailable books as immediately borrowable.

**Status:** Passed during manual testing.

---

## 10. Borrowing Eligibility and Business Rules

Use the following prompts to verify the configured library rules.

### A. Borrowing limit

```text
Can member M107 borrow another book?
```

Expected behavior:
- Check the member's active-loan count against their borrowing limit.
- Allow borrowing only when the member is eligible and the book is available.

### B. Outstanding fines

```text
Can member M108 borrow a book when their unpaid fines exceed ₹100?
```

Expected behavior:
- Block borrowing when unpaid fines exceed ₹100.
- Explain the reason clearly.

### C. Unavailable book

```text
Can I issue a book that has zero available copies?
```

Expected behavior:
- Reject the issue request when no copies are available.
- Do not create a loan record.

### D. Loan duration and fine calculation

Expected behavior:
- Use a 14-day loan period.
- Calculate overdue fines at ₹5 per overdue day.
- Apply the configured rules consistently when issuing and returning books.

**Status:** Successfully verified during manual testing.

---

## Running the Tests

1. Open a terminal in the project root.
2. Start LibroBot using `npm start`.
3. Enter one prompt at a time.
4. Verify the response against the expected behavior.
5. For issue and return actions, test both confirmation and cancellation.
6. Use the current database state when interpreting results. Some prompts may produce different availability or fine values after earlier tests change the database.





