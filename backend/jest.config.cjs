module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 120000,

  // Use Node's actual MongoDB driver rather than Jest's
  // potentially modified module environment.
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
};