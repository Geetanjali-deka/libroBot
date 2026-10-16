CREATE TABLE IF NOT EXISTS books (
    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    CHECK (total_copies >=0),
    CHECK (available_copies >=0),
    CHECK (available_copies <= total_copies)
);

CREATE TABLE IF NOT EXISTS members(
    member_id TEXT PRIMARY KEY ,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    max_books INTEGER NOT NULL DEFAULT 3,
    CHECK (max_books >=0)
);

CREATE TABLE IF NOT EXISTS loans (
    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    member_id TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,
    fine_amount REAL NOT NULL DEFAULT 0,
    fine_paid INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id),

    CHECK (fine_amount >=0),
    CHECK (fine_paid IN (0,1))
);