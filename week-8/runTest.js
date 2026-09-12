const { spawn } = require("child_process");
const { pactFile } = require("./pact.js");

module.exports = {
  runTests: async (testType) => {
    const vitest = spawn("npx", ["vitest", "run", testType], {
      stdio: "inherit",
      shell: true,
    });

    vitest.on("exit", (code) => {
      if (code) {
        console.log(
          `${testType} test failed :(\nOpen the log file in ./logs to see what happened`
        );
        process.exit(code);
      } else {
        console.log(
          `${testType} test passed! Open the pact file in ${pactFile}`
        );
        process.exit(0);
      }
    });
  },
};
