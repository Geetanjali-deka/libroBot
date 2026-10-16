
const getMemberLoans = require("./getMemberLoans");

console.log("Test 1: Existing member M102");
console.dir(getMemberLoans("M102"), {
  depth: null
});

console.log("\nTest 2: Member that does not exist");
console.dir(getMemberLoans("M999"), {
  depth: null
});
