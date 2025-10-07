// Jest setup file for test configuration
import * as fs from 'fs';
import * as path from 'path';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up test files after each test
afterEach(() => {
  // Clean up any generated files during tests
  const testFiles = [
    'data-comparison-config.json',
    'Export_result-',
    'Unmatched_rows-',
    'Export_AllFileB-'
  ];

  const files = fs.readdirSync(process.cwd());
  files.forEach(file => {
    if (testFiles.some(testFile => file.includes(testFile))) {
      try {
        fs.unlinkSync(path.join(process.cwd(), file));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});
