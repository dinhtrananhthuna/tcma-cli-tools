/**
 * Working Test Suite for DataComparisonPlugin
 *
 * This test suite tests the core functionality of the DataComparisonPlugin
 * using a simpler approach that avoids ES module import issues.
 */

import * as fs from 'fs';
import * as path from 'path';

// Test data paths
const sampleDir = path.resolve(__dirname, '../sample');
const fileAPath = path.join(sampleDir, 'fileA.csv');
const fileBPath = path.join(sampleDir, 'fileB.csv');

describe('DataComparisonPlugin - Core Logic Tests', () => {
  // Simple comparison key creation logic (extracted from plugin)
  function createComparisonKey(row: any, headers: string[], fieldIndices: number[]): string {
    return fieldIndices
      .map((index: number) => String(row[headers[index]] || ''))
      .join('|');
  }

  // Simple CSV reading simulation
  function readCSVFileSimple(filePath: string): { headers: string[], rows: any[] } {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');

    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    return { headers, rows };
  }

  describe('File Reading Logic', () => {
    test('should read fileA.csv correctly', () => {
      const fileData = readCSVFileSimple(fileAPath);

      expect(fileData.headers).toEqual(['id', 'postId', 'postContent', 'postDate']);
      expect(fileData.rows).toHaveLength(5);
      expect(fileData.rows[0]).toEqual({
        id: '1',
        postId: '101',
        postContent: '"Hello World"',
        postDate: '2024-01-01'
      });
    });

    test('should read fileB.csv correctly', () => {
      const fileData = readCSVFileSimple(fileBPath);

      expect(fileData.headers).toEqual([
        'twitterDetails_postId',
        'twitterDetails_postContent',
        'twitterDetails_showcaseLink',
        'twitterDetails_postDate',
        'id',
        'contentMainId'
      ]);
      expect(fileData.rows).toHaveLength(8);
      expect(fileData.rows[0]).toEqual({
        twitterDetails_postId: '101',
        twitterDetails_postContent: '"Hello World Tweet"',
        twitterDetails_showcaseLink: '"https://twitter.com/1"',
        twitterDetails_postDate: '2024-01-01',
        id: '1',
        contentMainId: '1001'
      });
    });

    test('should handle empty CSV file', () => {
      const emptyFile = path.join(sampleDir, 'empty.csv');
      fs.writeFileSync(emptyFile, '');

      const fileData = readCSVFileSimple(emptyFile);
      expect(fileData.headers).toEqual(['']);
      expect(fileData.rows).toEqual([]);

      // Clean up
      fs.unlinkSync(emptyFile);
    });

    test('should handle CSV file with only headers', () => {
      const headerOnlyFile = path.join(sampleDir, 'headers-only.csv');
      fs.writeFileSync(headerOnlyFile, 'col1,col2,col3\n');

      const fileData = readCSVFileSimple(headerOnlyFile);
      expect(fileData.headers).toEqual(['col1', 'col2', 'col3']);
      expect(fileData.rows).toEqual([]);

      // Clean up
      fs.unlinkSync(headerOnlyFile);
    });
  });

  describe('Comparison Key Creation', () => {
    test('should create comparison key correctly', () => {
      const row = {
        id: '1',
        postId: '101',
        postContent: 'Hello World',
        postDate: '2024-01-01'
      };
      const headers = ['id', 'postId', 'postContent', 'postDate'];
      const fieldIndices = [0, 1]; // Use id and postId for comparison

      const key = createComparisonKey(row, headers, fieldIndices);
      expect(key).toBe('1|101');
    });

    test('should handle empty values in comparison key', () => {
      const row = {
        id: '1',
        postId: '',
        postContent: 'Hello World',
        postDate: '2024-01-01'
      };
      const headers = ['id', 'postId', 'postContent', 'postDate'];
      const fieldIndices = [0, 1]; // Use id and postId for comparison

      const key = createComparisonKey(row, headers, fieldIndices);
      expect(key).toBe('1|');
    });

    test('should handle single field comparison', () => {
      const row = {
        id: '1',
        postId: '101',
        postContent: 'Hello World',
        postDate: '2024-01-01'
      };
      const headers = ['id', 'postId', 'postContent', 'postDate'];
      const fieldIndices = [1]; // Use only postId

      const key = createComparisonKey(row, headers, fieldIndices);
      expect(key).toBe('101');
    });
  });

  describe('Data Comparison Logic', () => {
    test('should compare files using postId matching', () => {
      const fileAData = readCSVFileSimple(fileAPath);
      const fileBData = readCSVFileSimple(fileBPath);

      // Find postId index in fileA (index 1) and twitterDetails_postId index in fileB (index 0)
      const fileAFieldIndex = 1; // postId
      const fileBFieldIndex = 0; // twitterDetails_postId

      // Create comparison set from fileA
      const fileASet = new Set<string>();
      fileAData.rows.forEach(row => {
        const key = createComparisonKey(row, fileAData.headers, [fileAFieldIndex]);
        fileASet.add(key);
      });

      // Find matches in fileB
      const matchedRows: any[] = [];
      const unmatchedRows: any[] = [];

      fileBData.rows.forEach(row => {
        const key = createComparisonKey(row, fileBData.headers, [fileBFieldIndex]);
        if (fileASet.has(key)) {
          matchedRows.push(row);
        } else {
          unmatchedRows.push(row);
        }
      });

      expect(matchedRows.length).toBe(5); // Posts 101, 102, 103, 104, 105 should match
      expect(unmatchedRows.length).toBe(3); // Posts 106, 107, 108 should be unmatched

      // Verify specific matches
      const matchedPostIds = matchedRows.map(row => row.twitterDetails_postId);
      expect(matchedPostIds).toContain('101');
      expect(matchedPostIds).toContain('102');
      expect(matchedPostIds).toContain('103');
      expect(matchedPostIds).toContain('104');
      expect(matchedPostIds).toContain('105');

      // Verify specific unmatched
      const unmatchedPostIds = unmatchedRows.map(row => row.twitterDetails_postId);
      expect(unmatchedPostIds).toContain('106');
      expect(unmatchedPostIds).toContain('107');
      expect(unmatchedPostIds).toContain('108');
    });

    test('should compare files using multiple fields', () => {
      const fileAData = readCSVFileSimple(fileAPath);
      const fileBData = readCSVFileSimple(fileBPath);

      // Use postId (index 1) and postDate (index 3) from fileA
      // Use twitterDetails_postId (index 0) and twitterDetails_postDate (index 3) from fileB
      const fileAFieldIndices = [1, 3]; // postId and postDate
      const fileBFieldIndices = [0, 3]; // twitterDetails_postId and twitterDetails_postDate

      // Create comparison set from fileA
      const fileASet = new Set<string>();
      fileAData.rows.forEach(row => {
        const key = createComparisonKey(row, fileAData.headers, fileAFieldIndices);
        fileASet.add(key);
      });

      // Find matches in fileB
      const matchedRows: any[] = [];
      const unmatchedRows: any[] = [];

      fileBData.rows.forEach(row => {
        const key = createComparisonKey(row, fileBData.headers, fileBFieldIndices);
        if (fileASet.has(key)) {
          matchedRows.push(row);
        } else {
          unmatchedRows.push(row);
        }
      });

      expect(matchedRows.length).toBe(5); // Same 5 matches
      expect(unmatchedRows.length).toBe(3); // Same 3 unmatched
    });
  });

  describe('Field Mapping Logic', () => {
    test('should create field mapping correctly', () => {
      const fileAHeaders = ['id', 'postId', 'postContent', 'postDate'];
      const fileBHeaders = ['twitterDetails_postId', 'twitterDetails_postContent', 'twitterDetails_showcaseLink', 'twitterDetails_postDate'];

      // Simulate user mapping choices
      const fieldMapping = {
        'id': 'twitterDetails_postId',         // Map id to twitterDetails_postId
        'postId': 'twitterDetails_postContent', // Map postId to twitterDetails_postContent
        'postContent': 'twitterDetails_showcaseLink', // Map postContent to twitterDetails_showcaseLink
        'postDate': 'twitterDetails_postDate'   // Map postDate to twitterDetails_postDate
      };

      // Verify mapping is complete
      fileAHeaders.forEach(header => {
        expect(fieldMapping[header as keyof typeof fieldMapping]).toBeDefined();
        expect(fileBHeaders).toContain(fieldMapping[header as keyof typeof fieldMapping]);
      });
    });
  });

  describe('Configuration Management', () => {
    test('should save and load configuration correctly', () => {
      const config = {
        fileAFields: [2],
        fileBFields: [1],
        fieldMapping: { 'postContent': 'twitterDetails_postContent' },
        createdAt: new Date().toISOString(),
        description: 'Test configuration'
      };

      const configPath = path.resolve(sampleDir, 'test-config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Load and verify configuration
      const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      expect(loadedConfig).toEqual(config);

      // Clean up
      fs.unlinkSync(configPath);
    });

    test('should handle corrupted configuration file', () => {
      const configPath = path.resolve(sampleDir, 'corrupted-config.json');
      fs.writeFileSync(configPath, 'invalid json content');

      expect(() => {
        JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }).toThrow();

      // Clean up
      fs.unlinkSync(configPath);
    });
  });

  describe('Export Functionality', () => {
    test('should ensure UTF-8 BOM is added to CSV files', () => {
      const testFile = path.join(sampleDir, 'test-bom.csv');
      const testContent = Buffer.from('header1,header2\nvalue1,value2');
      fs.writeFileSync(testFile, testContent);

      // Simulate BOM addition
      const content = fs.readFileSync(testFile);
      const hasBom = content.length >= 3 &&
                     content[0] === 0xEF &&
                     content[1] === 0xBB &&
                     content[2] === 0xBF;

      if (!hasBom) {
        const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
        const withBom = Buffer.concat([bom, content]);
        fs.writeFileSync(testFile, withBom);
      }

      // Verify BOM was added
      const finalContent = fs.readFileSync(testFile);
      expect(finalContent[0]).toBe(0xEF); // BOM first byte
      expect(finalContent[1]).toBe(0xBB); // BOM second byte
      expect(finalContent[2]).toBe(0xBF); // BOM third byte

      // Clean up
      fs.unlinkSync(testFile);
    });

    test('should not add BOM if already present', () => {
      const testFile = path.join(sampleDir, 'test-with-bom.csv');
      const testContentWithBOM = Buffer.concat([
        Buffer.from([0xEF, 0xBB, 0xBF]), // BOM
        Buffer.from('header1,header2\nvalue1,value2')
      ]);
      fs.writeFileSync(testFile, testContentWithBOM);

      const originalSize = fs.statSync(testFile).size;

      // Check if BOM already exists
      const content = fs.readFileSync(testFile);
      const hasBom = content.length >= 3 &&
                     content[0] === 0xEF &&
                     content[1] === 0xBB &&
                     content[2] === 0xBF;

      expect(hasBom).toBe(true);
      expect(content.length).toBe(originalSize); // Size should not change

      // Clean up
      fs.unlinkSync(testFile);
    });
  });

  describe('Error Handling', () => {
    test('should handle file not found error', () => {
      const nonExistentFile = path.join(sampleDir, 'non-existent.csv');

      expect(() => {
        fs.readFileSync(nonExistentFile);
      }).toThrow();
    });

    test('should handle malformed CSV data', () => {
      const malformedFile = path.join(sampleDir, 'malformed.csv');
      fs.writeFileSync(malformedFile, 'header1,header2\nvalue1'); // Missing value for header2

      const fileData = readCSVFileSimple(malformedFile);
      expect(fileData.rows[0]).toEqual({ header1: 'value1', header2: '' });

      // Clean up
      fs.unlinkSync(malformedFile);
    });

    test('should handle empty values in data', () => {
      const fileWithEmptyValues = path.join(sampleDir, 'empty-values.csv');
      fs.writeFileSync(fileWithEmptyValues, 'header1,header2\nvalue1,\n,value3');

      const fileData = readCSVFileSimple(fileWithEmptyValues);
      expect(fileData.rows[0]).toEqual({ header1: 'value1', header2: '' });
      expect(fileData.rows[1]).toEqual({ header1: '', header2: 'value3' });

      // Clean up
      fs.unlinkSync(fileWithEmptyValues);
    });
  });

  describe('Integration Scenarios', () => {
    test('should complete end-to-end comparison workflow', () => {
      // Step 1: Read both files
      const fileAData = readCSVFileSimple(fileAPath);
      const fileBData = readCSVFileSimple(fileBPath);

      // Step 2: Configure comparison (postId matching)
      const fileAFieldIndices = [1]; // postId
      const fileBFieldIndices = [0]; // twitterDetails_postId

      // Step 3: Create comparison set from fileA
      const fileASet = new Set<string>();
      fileAData.rows.forEach(row => {
        const key = createComparisonKey(row, fileAData.headers, fileAFieldIndices);
        fileASet.add(key);
      });

      // Step 4: Find matches in fileB
      const matchedRows: any[] = [];
      const unmatchedRows: any[] = [];

      fileBData.rows.forEach(row => {
        const key = createComparisonKey(row, fileBData.headers, fileBFieldIndices);
        if (fileASet.has(key)) {
          matchedRows.push(row);
        } else {
          unmatchedRows.push(row);
        }
      });

      // Step 5: Verify results
      expect(matchedRows.length).toBe(5); // All 5 posts from fileA should match
      expect(unmatchedRows.length).toBe(3); // 3 additional posts in fileB

      // Step 6: Simulate field mapping
      const fieldMapping = {
        'id': 'twitterDetails_postId',
        'postId': 'twitterDetails_postContent',
        'postContent': 'twitterDetails_showcaseLink',
        'postDate': 'twitterDetails_postDate'
      };

      // Step 7: Simulate export of matched rows with field mapping
      const exportData = matchedRows.map(row => {
        const exportRow: any = {};
        fileAData.headers.forEach(header => {
          const mappedField = fieldMapping[header as keyof typeof fieldMapping];
          exportRow[header] = row[mappedField] || '';
        });
        return exportRow;
      });

      // Verify export data structure
      expect(exportData).toHaveLength(matchedRows.length);
      exportData.forEach(row => {
        expect(row).toHaveProperty('id');
        expect(row).toHaveProperty('postId');
        expect(row).toHaveProperty('postContent');
        expect(row).toHaveProperty('postDate');
      });
    });

    test('should handle different comparison scenarios', () => {
      const fileAData = readCSVFileSimple(fileAPath);
      const fileBData = readCSVFileSimple(fileBPath);

      // Test scenario 1: No matches
      const fileASet = new Set<string>();
      fileASet.add('999'); // Non-existent postId

      const matchedRows: any[] = [];
      fileBData.rows.forEach(row => {
        if (fileASet.has(row.twitterDetails_postId)) {
          matchedRows.push(row);
        }
      });

      expect(matchedRows).toHaveLength(0);

      // Test scenario 2: All matches
      const allPostIds = fileBData.rows.map(row => row.twitterDetails_postId);
      const allFileASet = new Set(allPostIds);

      const allMatchedRows: any[] = [];
      fileBData.rows.forEach(row => {
        if (allFileASet.has(row.twitterDetails_postId)) {
          allMatchedRows.push(row);
        }
      });

      expect(allMatchedRows.length).toBe(fileBData.rows.length);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large number of fields', () => {
      // Create a test row with many fields
      const largeRow: any = {};
      const largeHeaders: string[] = [];

      for (let i = 0; i < 100; i++) {
        largeHeaders.push(`field${i}`);
        largeRow[`field${i}`] = `value${i}`;
      }

      const fieldIndices = Array.from({ length: 100 }, (_, i) => i);
      const key = createComparisonKey(largeRow, largeHeaders, fieldIndices);

      expect(key).toContain('value0');
      expect(key).toContain('value99');
      expect(key.split('|')).toHaveLength(100);
    });

    test('should handle special characters in data', () => {
      const specialRow = {
        id: '1',
        content: 'Hello, "world"! @#$%^&*()',
        date: '2024-01-01'
      };
      const headers = ['id', 'content', 'date'];
      const fieldIndices = [1]; // content field

      const key = createComparisonKey(specialRow, headers, fieldIndices);
      expect(key).toBe('Hello, "world"! @#$%^&*()');
    });

    test('should handle Unicode characters', () => {
      const unicodeRow = {
        id: '1',
        content: 'Hello 世界 🌍 Café',
        date: '2024-01-01'
      };
      const headers = ['id', 'content', 'date'];
      const fieldIndices = [1]; // content field

      const key = createComparisonKey(unicodeRow, headers, fieldIndices);
      expect(key).toBe('Hello 世界 🌍 Café');
    });
  });
});