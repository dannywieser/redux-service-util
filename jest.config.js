module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.{ts,js}',
    '!src/**/*.styles.{ts}',
    '!src/config/*.{ts}'
  ],
  moduleFileExtensions: [
    'ts',
    'js'
  ],
  testMatch: [
    '**/__tests__/*.+(ts|js)'
  ],
  globals: {
    'ts-jest': {
      'tsConfig': 'tsconfig.json'
    }
  },
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest'
  },
  resetMocks: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    'dist',
    'typings'
  ]
}
