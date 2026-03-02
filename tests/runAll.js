/**
 * Test runner - executes all test suites
 */
const testFiles = [
  "./js/keyboardNavigation.test.js",
  "./js/notes.test.js",
  "./js/versesCache.test.js",
  "./js/navigation.test.js",
];

let allPassed = true;

for (const file of testFiles) {
  try {
    const { runAllTests } = require(file);
    runAllTests();
  } catch (err) {
    console.error(`\n❌ FAILED: ${file}`);
    console.error(err.message);
    allPassed = false;
  }
}

if (allPassed) {
  console.log("\n🎉 All test suites passed!");
} else {
  console.error("\n💥 Some tests failed!");
  process.exit(1);
}
