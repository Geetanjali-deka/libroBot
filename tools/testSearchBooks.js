const searchBooks = require("./searchBooks");

// Test 1: Search by title
console.log("Searching for Wings of Fire:");
console.log(searchBooks("Wings of Fire"));

// Test 2: Search by author
console.log("\nSearching for Abdul Kalam:");
console.log(searchBooks("Abdul Kalam"));

// Test 3: Search by genre
console.log("\nSearching for Fantasy books:");
console.log(searchBooks("Fantasy"));

// Test 4: Search for a book that does not exist
console.log("\nSearching for an unknown book:");
console.log(searchBooks("Nonexistent Book"));
