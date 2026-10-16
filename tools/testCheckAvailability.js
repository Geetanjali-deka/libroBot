
const checkAvailability = require("./checkAvailability");

// Test 1: A book with available copies
console.log("Test 1: Available book");
console.log(checkAvailability("Wings of Fire"));

// Test 2: A book that does not exist
console.log("\nTest 2: Unknown book");
console.log(checkAvailability("Unknown Book XYZ"));

// Test 3: A book that currently has no copies available
console.log("\nTest 3: Unavailable book");
console.log(checkAvailability("The Lord of the Rings"));
