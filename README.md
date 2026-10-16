###LibroBot — Smart College Library Assistant###

Task: T1 — Smart College Library Assistant
Agent: LibroBot

1. Overview

LibroBot is a command-line library assistant for searching books, checking availability, managing book issues and returns, viewing a member's loans, and reporting overdue books. Library records are stored in an SQLite database rather than a vector database or a retrieval-augmented generation (RAG) store.


2. Technology

- Node.js / JavaScript: runs the command-line application and database tools.
- LangChain (@langchain/core, @langchain/groq): connects the language model to tools.
- Groq: provides the language-model API.
- SQLite / better-sqlite3: stores and queries library data.
- Zod: defines tool argument schemas.
- dotenv: loads the API key from an environment file.


3. Project Structure

libroBot/
├── database/
│   ├── schema.sql
│   ├── seed.js
│   ├── check-db.js
│   └── librobot.db
├── tools/
│   ├── searchBooks.js
│   ├── checkAvailability.js
│   ├── issueBook.js
│   ├── returnBook.js
│   ├── getMemberLoans.js
│   ├── listOverdueBooks.js
│   └── test*.js
├── agent.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
└── test_prompts.md


4. Database Design

The SQLite database contains three related tables.
- books — book_id (primary key), title, author, genre, total_copies, available_copies.
- members — member_id (primary key), name, email, department, max_books (defaults to 3).
- loans — loan_id (primary key), book_id (foreign key to books.book_id), member_id (foreign key to members.member_id), issue_date, due_date, return_date, fine_amount, fine_paid.
A book can have many loan records over time, and a member can have many loan records. Each loan refers to one book and one member. An unset (NULL) return_date indicates an active loan.
```mermaid
erDiagram
    {
        INTEGER book_id PK
        TEXT title
        TEXT author
        TEXT genre
        INTEGER total_copies
        INTEGER available_copies
    }
    MEMBERS {
        TEXT member_id PK
        TEXT name
        TEXT email
        TEXT department
        INTEGER max_books
    }
    LOANS {
        INTEGER loan_id PK
        INTEGER book_id FK
        TEXT member_id FK
        TEXT issue_date
        TEXT due_date
        TEXT return_date
        REAL fine_amount
        INTEGER fine_paid
    }
```
The seed data has been verified as 30 books, 15 members, and 20 loan records. Use database/seed.js to initialize sample data and database/check-db.js to inspect the database counts. Check the seed script before rerunning it against a database containing data you want to keep.


5. Tools

Tool	Purpose
search_books	Search books by title, author, or genre.
check_availability	Check copies available and provide same-genre alternatives when possible.
issue_book	Prepare and perform an issue after validation and confirmation.
return_book	Prepare and perform a return and calculate the applicable fine.
get_member_loans	Retrieve a member's loans, statuses, and unpaid fines.
list_overdue_books	List active overdue loans and calculate estimated fines.


6. Business Rules

- The default maximum is 3 active loans per member, subject to the member's max_books value.
- The standard loan period is 14 days.
- The late fine is ₹5 per day after the due date.
- A book cannot be issued if no copies are available.
- A member cannot borrow the same book again while an active loan for that book exists.
- Borrowing is blocked when a member's unpaid fines are greater than ₹100.
- Issue and return operations require explicit user confirmation.
- When a requested book is unavailable, the assistant should offer available titles from the same genre when suitable alternatives exist.
- The overdue report includes active loans whose due dates have passed. Its fines are estimates until a return is processed.


7. Setup and Run
Prerequisites

- Node.js and npm
- A Groq API key
Install dependencies
From the project root, run:
npm.cmd install
Configure the API key
Create a .env file in the project root with the following line, replacing the placeholder with your own key:
GROQ_API_KEY=your_groq_api_key_here
Do not commit or share .env. The .gitignore file excludes .env and node_modules/. The .env.example file should contain only a placeholder, never a real key.
Start LibroBot
node .\agent.js
Enter a request when the You: prompt appears. Type exit to close the application.


8. Tests and Verification

Individual test scripts are available in tools/, for example:
node .\tools\testSearchBooks.js
node .\tools\testCheckAvailability.js
node .\tools\testGetMemberLoans.js
node .\tools\testListOverdueBooks.js
Issue and return tests may change database state. Run them only when you understand their effects and can restore or reseed the test database if necessary. Record the exact prompts, actual outputs, and pass/fail results in test_prompts.md; do not label a case as passed unless you observed the result.
Manually verified scenarios
During development, the following behaviours were observed: an issue request succeeded after confirmation; cancelling an issue did not perform the issue; a returned loan showed a return date; duplicate borrowing was rejected; an additional issue was blocked at the member's limit; borrowing was blocked for a member with ₹105 in unpaid fines; an overdue report returned five overdue loans with a total estimated fine of ₹250; and an unavailable Clean Code query suggested available technology books.


9. Implementation Note

The current command-line implementation uses application-level request matching for issue and return confirmation. Review this path against the task's requirement for genuine model-driven tool calling: do not claim that issue and return are fully handled through model-issued tool calls until that behaviour has been verified and, if necessary, refactored. Document only capabilities that the submitted code actually demonstrates.


10. Security and Limitations

The API key is loaded from .env, and .env / node_modules/ are excluded from Git by .gitignore. Database operations depend on valid input, current database state, and API availability. Before submission, verify error handling for missing records, review all six tool paths, run the required prompts from the acceptance criteria, and update test_prompts.md with observed results.