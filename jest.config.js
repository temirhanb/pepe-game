/** @type {import('jest').Config} */
export default {
  transform: {},
  testMatch: ["**/__tests__/**/*.test.js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
