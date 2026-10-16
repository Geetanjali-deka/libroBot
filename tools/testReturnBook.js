
const returnBook = require("./returnBook");

// Test 1: Request confirmation before returning
console.log("Test 1: Confirmation required");

console.log(
  returnBook("M108", "The Hobbit")
);

// Test 2: Confirm the return
console.log("\nTest 2: Confirmed return");

console.log(
  returnBook("M108", "The Hobbit", true)
);
