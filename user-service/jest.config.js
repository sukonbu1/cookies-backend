module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*-simple.test.js', '**/__tests__/**/*-controller.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testTimeout: 10000,
  testPathIgnorePatterns: ['/node_modules/', '/auth.test.js']
}; 