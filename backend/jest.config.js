/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Dòng này giúp Jest hiểu các đường dẫn trong code của bạn
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Bỏ qua thư mục build và node_modules
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};