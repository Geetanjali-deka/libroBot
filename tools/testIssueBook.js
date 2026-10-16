
const issueBook = require("./issueBook");

// Test 1: Ask for confirmation first
console.log("Test 1: Without confirmation");

console.log(
  issueBook("M115", "The Great Gatsby")
);

// Test 2: Issue the book after confirmation
console.log("\nTest 2: With confirmation");

console.log(
  issueBook("M115", "The Great Gatsby", true)
);


