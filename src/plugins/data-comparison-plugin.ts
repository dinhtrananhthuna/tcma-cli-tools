import { BasePlugin } from '../core/base-plugin';
import { UIUtils } from '../utils/ui-utils';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import inquirer from 'inquirer';
import chalk from 'chalk';

interface FileData {
  headers: string[];
  rows: any[];
}

interface ComparisonResult {
  matchedRows: any[];
  fieldMapping: { [key: string]: string };
}

export class DataComparisonPlugin extends BasePlugin {
  name = 'Data Comparison & Mapping Tool';
  description = 'Compare and map data between CSV/Excel files, find matching records and export results';
  commands = ['compare', 'data-compare'];

  async execute(command: string, args?: string[]): Promise<void> {
    await this.showMainMenu();
  }

  private async showMainMenu(): Promise<void> {
    this.showPluginHeader('Data Comparison & Mapping Tool');
    
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green('                    Welcome to Data Comparison & Mapping Tool'));
    console.log(chalk.yellow('                    Compare and map data between CSV/Excel files'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.blue('What would you like to do?'),
        choices: [
          { name: '1. Start Data Comparison Wizard', value: 'start' },
          { name: '2. Exit to Main Menu', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') {
      return;
    }

    await this.startWizard();
  }

  private async startWizard(): Promise<void> {
    try {
      // Step 1: Select reference file (File A)
      const fileA = await this.selectFile('reference', 'Select reference file (File A)');
      const dataA = await this.readFile(fileA);
      
      // Step 2: Select extraction file (File B)
      const fileB = await this.selectFile('extraction', 'Select extraction file (File B)', fileA);
      const dataB = await this.readFile(fileB);
      
      // Step 3: Data comparison
      const comparisonResult = await this.performDataComparison(dataA, dataB);
      
      // Step 4: Field mapping
      const fieldMapping = await this.performFieldMapping(dataA.headers, dataB.headers);
      
      // Step 5: Export CSV
      await this.exportToCSV(comparisonResult.matchedRows, fieldMapping, dataA.headers);
      
      // Step 6: Completion and return menu
      await this.showCompletionMenu();
      
    } catch (error) {
      this.log(`Error in wizard: ${error}`, 'error');
      await this.showPluginFooter();
    }
  }

  private async selectFile(type: 'reference' | 'extraction', message: string, excludeFile?: string): Promise<string> {
    const files = this.getAvailableFiles(excludeFile);
    
    if (files.length === 0) {
      throw new Error(`No ${type} files found in current directory`);
    }

    const choices = files.slice(0, 10).map((file, index) => ({
      name: `${index + 1}. ${file}`,
      value: file,
      short: file
    }));

    const { selectedFile } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFile',
        message: chalk.blue(message),
        choices: choices,
        pageSize: 10
      }
    ]);

    return selectedFile;
  }

  private getAvailableFiles(excludeFile?: string): string[] {
    const currentDir = process.cwd();
    const files = fs.readdirSync(currentDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return (ext === '.csv' || ext === '.xlsx' || ext === '.xls') && 
               file !== excludeFile &&
               fs.statSync(path.join(currentDir, file)).isFile();
      })
      .sort();

    return files;
  }

  private async readFile(filePath: string): Promise<FileData> {
    const ext = path.extname(filePath).toLowerCase();
    const fullPath = path.resolve(filePath);

    if (ext === '.csv') {
      return this.readCSVFile(fullPath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      return this.readExcelFile(fullPath);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  private async readCSVFile(filePath: string): Promise<FileData> {
    return new Promise((resolve, reject) => {
      const headers: string[] = [];
      const rows: any[] = [];
      let isFirstRow = true;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => {
          if (isFirstRow) {
            headers.push(...Object.keys(row));
            isFirstRow = false;
          }
          rows.push(row);
        })
        .on('end', () => {
          resolve({ headers, rows });
        })
        .on('error', (error: any) => {
          reject(error);
        });
    });
  }

  private readExcelFile(filePath: string): FileData {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      throw new Error('Excel file is empty');
    }

    const headers = jsonData[0] as string[];
    const rows = (jsonData.slice(1) as any[][]).map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    return { headers, rows };
  }

  private async performDataComparison(dataA: FileData, dataB: FileData): Promise<ComparisonResult> {
    this.showPluginHeader('Data Comparison');
    
    // Display file A columns
    console.log(chalk.green('File A (Reference) columns:'));
    dataA.headers.forEach((header, index) => {
      console.log(chalk.white(`  ${index + 1}. ${header}`));
    });
    console.log();

    // Display file B columns
    console.log(chalk.green('File B (Extraction) columns:'));
    dataB.headers.forEach((header, index) => {
      console.log(chalk.white(`  ${index + 1}. ${header}`));
    });
    console.log();

    // Get field selection for comparison
    const { fileAFields } = await inquirer.prompt([
      {
        type: 'input',
        name: 'fileAFields',
        message: chalk.blue('Enter File A field numbers to compare (comma-separated, e.g., 1,2):'),
        validate: (input: string) => {
          const fields = input.split(',').map((f: string) => parseInt(f.trim()));
          return fields.every((f: number) => f >= 1 && f <= dataA.headers.length) ? true : 'Invalid field numbers';
        }
      }
    ]);

    const { fileBFields } = await inquirer.prompt([
      {
        type: 'input',
        name: 'fileBFields',
        message: chalk.blue('Enter File B field numbers to compare (comma-separated, e.g., 5,1):'),
        validate: (input: string) => {
          const fields = input.split(',').map((f: string) => parseInt(f.trim()));
          return fields.every((f: number) => f >= 1 && f <= dataB.headers.length) ? true : 'Invalid field numbers';
        }
      }
    ]);

    const fileAFieldIndices = fileAFields.split(',').map((f: string) => parseInt(f.trim()) - 1);
    const fileBFieldIndices = fileBFields.split(',').map((f: string) => parseInt(f.trim()) - 1);

    // Create comparison sets
    const fileASet = new Set<string>();
    dataA.rows.forEach(row => {
      const key = fileAFieldIndices.map((index: number) => String(row[dataA.headers[index]] || '')).join('|');
      fileASet.add(key);
    });

    // Find matching rows in file B
    const matchedRows: any[] = [];
    dataB.rows.forEach(row => {
      const key = fileBFieldIndices.map((index: number) => String(row[dataB.headers[index]] || '')).join('|');
      if (fileASet.has(key)) {
        matchedRows.push(row);
      }
    });

    this.log(`Found ${matchedRows.length} matching rows out of ${dataB.rows.length} total rows`, 'success');

    return {
      matchedRows,
      fieldMapping: {}
    };
  }

  private async performFieldMapping(fileAHeaders: string[], fileBHeaders: string[]): Promise<{ [key: string]: string }> {
    this.showPluginHeader('Field Mapping');
    
    console.log(chalk.green('Map File B fields to File A fields:'));
    console.log();

    const fieldMapping: { [key: string]: string } = {};

    for (const fileAHeader of fileAHeaders) {
      const choices = fileBHeaders.map((header, index) => ({
        name: `${index + 1}. ${header}`,
        value: header,
        short: header
      }));

      const { selectedField } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedField',
          message: chalk.blue(`Map File A field "${fileAHeader}" to File B field:`),
          choices: choices
        }
      ]);

      fieldMapping[fileAHeader] = selectedField;
    }

    return fieldMapping;
  }

  private async exportToCSV(matchedRows: any[], fieldMapping: { [key: string]: string }, outputHeaders: string[]): Promise<void> {
    this.showPluginHeader('Export Results');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Export_result-${timestamp}.csv`;
    const filePath = path.resolve(fileName);

    // Prepare data for export
    const exportData = matchedRows.map(row => {
      const exportRow: any = {};
      outputHeaders.forEach(header => {
        const mappedField = fieldMapping[header];
        exportRow[header] = row[mappedField] || '';
      });
      return exportRow;
    });

    // Write CSV file
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: outputHeaders.map(header => ({ id: header, title: header }))
    });

    await csvWriter.writeRecords(exportData);

    this.log(`Successfully exported ${exportData.length} rows to ${fileName}`, 'success');
    console.log(chalk.green(`File saved at: ${filePath}`));
  }

  private async showCompletionMenu(): Promise<void> {
    console.log();
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.blue('What would you like to do next?'),
        choices: [
          { name: '1. Start New Comparison', value: 'new' },
          { name: '2. Return to Main Menu', value: 'main' }
        ]
      }
    ]);

    if (action === 'new') {
      await this.startWizard();
    } else {
      await this.showPluginFooter();
    }
  }
}
