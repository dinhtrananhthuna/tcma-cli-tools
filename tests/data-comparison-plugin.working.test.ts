jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    readdirSync: jest.fn((...args: Parameters<typeof actual.readdirSync>) =>
      actual.readdirSync(...args)
    ),
    statSync: jest.fn((...args: Parameters<typeof actual.statSync>) => actual.statSync(...args)),
    existsSync: jest.fn((...args: Parameters<typeof actual.existsSync>) =>
      actual.existsSync(...args)
    ),
    readFileSync: jest.fn((...args: Parameters<typeof actual.readFileSync>) =>
      actual.readFileSync(...args)
    ),
    writeFileSync: jest.fn((...args: Parameters<typeof actual.writeFileSync>) =>
      actual.writeFileSync(...args)
    ),
  };
});

jest.mock('inquirer', () => ({
  __esModule: true,
  default: {
    prompt: jest.fn(),
  },
}));

const createObjectCsvWriterMock = jest.fn();
const writeRecordsMocks: jest.Mock[] = [];

jest.mock('csv-writer', () => ({
  __esModule: true,
  createObjectCsvWriter: createObjectCsvWriterMock,
}));

createObjectCsvWriterMock.mockImplementation(() => {
  const writeRecords = jest.fn().mockResolvedValue(undefined);
  writeRecordsMocks.push(writeRecords);
  return { writeRecords };
});

import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';

import { DataComparisonPlugin } from '../src/plugins/data-comparison-plugin';

const promptMock = inquirer.prompt as unknown as jest.Mock;

const sampleDir = path.resolve(__dirname, '../sample');
const fileAPath = path.join(sampleDir, 'fileA.csv');
const fileBPath = path.join(sampleDir, 'fileB.csv');
const fileAXlsx = path.join(sampleDir, 'fileA.xlsx');

let plugin: DataComparisonPlugin;
let pluginAny: any;

beforeEach(() => {
  jest.clearAllMocks();
  plugin = new DataComparisonPlugin();
  pluginAny = plugin as any;
  promptMock.mockReset();
  writeRecordsMocks.length = 0;
  createObjectCsvWriterMock.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('DataComparisonPlugin integration tests', () => {
  test('execute delegates to showMainMenu', async () => {
    const showMainMenuSpy = jest.spyOn(pluginAny, 'showMainMenu').mockResolvedValue(undefined);

    await plugin.execute('compare');

    expect(showMainMenuSpy).toHaveBeenCalledTimes(1);
  });

  test('showMainMenu exits when user chooses exit', async () => {
    promptMock.mockResolvedValueOnce({ action: 'exit' });
    const startWizardSpy = jest.spyOn(pluginAny, 'startWizard').mockResolvedValue(undefined);

    await pluginAny.showMainMenu();

    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(startWizardSpy).not.toHaveBeenCalled();
  });

  test('getAvailableFiles returns sorted CSV/XLSX files', () => {
    const readdirMock = fs.readdirSync as jest.Mock;
    const statMock = fs.statSync as jest.Mock;

    readdirMock.mockReturnValueOnce(['b.xlsx', 'a.csv', 'notes.txt']);
    statMock
      .mockImplementationOnce(() => ({ isFile: () => true }))
      .mockImplementationOnce(() => ({ isFile: () => true }))
      .mockImplementationOnce(() => ({ isFile: () => false }));

    const available = pluginAny.getAvailableFiles();

    expect(available).toEqual(['a.csv', 'b.xlsx']);
  });

  test('selectFile returns user choice from available files', async () => {
    jest.spyOn(pluginAny, 'getAvailableFiles').mockReturnValue(['a.csv', 'b.xlsx']);
    promptMock.mockResolvedValueOnce({ selectedFile: 'b.xlsx' });

    const selected = await pluginAny.selectFile('reference', 'Choose file');

    expect(selected).toBe('b.xlsx');
  });

  test('readFile parses CSV files via readCSVFile', async () => {
    const data = await pluginAny.readFile(fileAPath);

    expect(data.headers).toContain('postId');
    expect(data.rows).toHaveLength(5);
    expect(data.rows[0]).toHaveProperty('postId', '101');
  });

  test('readFile parses XLSX files via readExcelFile', async () => {
    const data = await pluginAny.readFile(fileAXlsx);

    expect(data.headers).toContain('postId');
    expect(data.rows.length).toBeGreaterThan(0);
  });

  test('readFile throws on unsupported extensions', async () => {
    await expect(pluginAny.readFile('unsupported.json')).rejects.toThrow('Unsupported file format');
  });

  test('performDataComparison compares rows using prompt selections', async () => {
    const dataA = await pluginAny.readFile(fileAPath);
    const dataB = await pluginAny.readFile(fileBPath);

    promptMock
      .mockResolvedValueOnce({ fileAFields: '2' })
      .mockResolvedValueOnce({ fileBFields: '1' })
      .mockResolvedValueOnce({ exportUnmatched: false });

    const exportUnmatchedSpy = jest
      .spyOn(pluginAny, 'exportUnmatchedRows')
      .mockResolvedValue(undefined);

    const result = await pluginAny.performDataComparison(dataA, dataB);

    expect(result.matchedRows).toHaveLength(5);
    expect(result.unmatchedRows).toHaveLength(3);
    expect(result.fileAFields).toEqual([2]);
    expect(result.fileBFields).toEqual([1]);
    expect(exportUnmatchedSpy).not.toHaveBeenCalled();
  });

  test('performDataComparison re-prompts until field counts match', async () => {
    const dataA = await pluginAny.readFile(fileAPath);
    const dataB = await pluginAny.readFile(fileBPath);

    promptMock
      .mockResolvedValueOnce({ fileAFields: '1,2' })
      .mockResolvedValueOnce({ fileBFields: '1' })
      .mockResolvedValueOnce({ fileAFields: '1,2' })
      .mockResolvedValueOnce({ fileBFields: '1,2' })
      .mockResolvedValueOnce({ exportUnmatched: false });

    const exportUnmatchedSpy = jest
      .spyOn(pluginAny, 'exportUnmatchedRows')
      .mockResolvedValue(undefined);

    const result = await pluginAny.performDataComparison(dataA, dataB);

    expect(result.fileAFields).toEqual([1, 2]);
    expect(result.fileBFields).toEqual([1, 2]);
    expect(promptMock).toHaveBeenCalledTimes(5);
    expect(exportUnmatchedSpy).not.toHaveBeenCalled();
  });

  test('performDataComparisonWithConfig reuses saved configuration and can export unmatched rows', async () => {
    const dataA = await pluginAny.readFile(fileAPath);
    const dataB = await pluginAny.readFile(fileBPath);

    const config = {
      fileAFields: [2],
      fileBFields: [1],
      fieldMapping: { id: 'twitterDetails_postId' },
      createdAt: new Date().toISOString(),
    };

    promptMock.mockResolvedValueOnce({ exportUnmatched: true });
    const exportUnmatchedSpy = jest
      .spyOn(pluginAny, 'exportUnmatchedRows')
      .mockResolvedValue(undefined);

    const result = await pluginAny.performDataComparisonWithConfig(dataA, dataB, config);

    expect(result.matchedRows).toHaveLength(5);
    expect(result.unmatchedRows).toHaveLength(3);
    expect(result.fieldMapping).toEqual(config.fieldMapping);
    expect(exportUnmatchedSpy).toHaveBeenCalledTimes(1);
  });

  test('performFieldMapping collects mapping for each File A header', async () => {
    const dataA = await pluginAny.readFile(fileAPath);
    const dataB = await pluginAny.readFile(fileBPath);

    dataA.headers.forEach((header: string) => {
      promptMock.mockResolvedValueOnce({ selectedField: dataB.headers[0] });
    });

    const mapping = await pluginAny.performFieldMapping(dataA.headers, dataB.headers);

    dataA.headers.forEach((header: string) => {
      expect(mapping[header]).toBe(dataB.headers[0]);
    });
  });

  test('saveConfigPrompt saves configuration when user confirms', async () => {
    promptMock
      .mockResolvedValueOnce({ saveConfig: true })
      .mockResolvedValueOnce({ description: 'Test config' });

    const saveConfigSpy = jest.spyOn(pluginAny, 'saveConfig').mockResolvedValue(undefined);

    await pluginAny.saveConfigPrompt([1], [2], { id: 'twitterDetails_postId' });

    expect(saveConfigSpy).toHaveBeenCalledWith([1], [2], { id: 'twitterDetails_postId' }, 'Test config');
  });

  test('saveConfigPrompt skips save when user declines', async () => {
    promptMock.mockResolvedValueOnce({ saveConfig: false });
    const saveConfigSpy = jest.spyOn(pluginAny, 'saveConfig').mockResolvedValue(undefined);

    await pluginAny.saveConfigPrompt([1], [2], {});

    expect(saveConfigSpy).not.toHaveBeenCalled();
  });

  test('saveConfig writes configuration file', async () => {
    const writeFileMock = fs.writeFileSync as jest.Mock;
    writeFileMock.mockImplementationOnce(() => undefined);

    await pluginAny.saveConfig([1], [2], { id: 'mapped' }, 'desc');

    expect(writeFileMock).toHaveBeenCalledTimes(1);
    const [, payload] = writeFileMock.mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.fileAFields).toEqual([1]);
    expect(parsed.fileBFields).toEqual([2]);
    expect(parsed.fieldMapping).toEqual({ id: 'mapped' });
    expect(parsed.description).toBe('desc');
  });

  test('checkForExistingConfig returns parsed configuration info', async () => {
    const fakeConfigPath = path.resolve('data-comparison-config.json');
    const configData = {
      fileAFields: [1],
      fileBFields: [2],
      fieldMapping: { id: 'mapped' },
      createdAt: '2024-01-01T00:00:00Z',
    };

    const existsSyncMock = fs.existsSync as jest.Mock;
    const readFileSyncMock = fs.readFileSync as jest.Mock;

    existsSyncMock.mockReturnValueOnce(true);
    readFileSyncMock.mockReturnValueOnce(JSON.stringify(configData));

    const result = await pluginAny.checkForExistingConfig();

    expect(result).toEqual(configData);
    expect(existsSyncMock).toHaveBeenCalledWith(fakeConfigPath);
  });

  test('checkForExistingConfig handles malformed configuration gracefully', async () => {
    const existsSyncMock = fs.existsSync as jest.Mock;
    const readFileSyncMock = fs.readFileSync as jest.Mock;

    existsSyncMock.mockReturnValueOnce(true);
    readFileSyncMock.mockReturnValueOnce('not json');

    const result = await pluginAny.checkForExistingConfig();

    expect(result).toBeNull();
  });

  test('handleExportChoice exports only matched rows when chosen', async () => {
    const dataA = await pluginAny.readFile(fileAPath);
    const dataB = await pluginAny.readFile(fileBPath);

    promptMock.mockResolvedValueOnce({ exportChoice: 'matched-only' });

    const exportMatchedRowsSpy = jest
      .spyOn(pluginAny, 'exportMatchedRows')
      .mockResolvedValue(undefined);
    const exportAllFileBRowsSpy = jest
      .spyOn(pluginAny, 'exportAllFileBRows')
      .mockResolvedValue(undefined);

    await pluginAny.handleExportChoice(
      {
        matchedRows: dataB.rows.slice(0, 2),
        unmatchedRows: dataB.rows.slice(2, 3),
        fieldMapping: {},
      },
      { id: 'twitterDetails_postId' },
      dataA,
      dataB
    );

    expect(exportMatchedRowsSpy).toHaveBeenCalledTimes(1);
    expect(exportAllFileBRowsSpy).not.toHaveBeenCalled();
  });

  test('handleExportChoice exports all File B rows when chosen', async () => {
    const dataA = await pluginAny.readFile(fileAPath);
    const dataB = await pluginAny.readFile(fileBPath);

    promptMock.mockResolvedValueOnce({ exportChoice: 'all-fileb' });

    const exportMatchedRowsSpy = jest
      .spyOn(pluginAny, 'exportMatchedRows')
      .mockResolvedValue(undefined);
    const exportAllFileBRowsSpy = jest
      .spyOn(pluginAny, 'exportAllFileBRows')
      .mockResolvedValue(undefined);

    await pluginAny.handleExportChoice(
      {
        matchedRows: dataB.rows.slice(0, 2),
        unmatchedRows: dataB.rows.slice(2, 3),
        fieldMapping: {},
      },
      { id: 'twitterDetails_postId' },
      dataA,
      dataB
    );

    expect(exportAllFileBRowsSpy).toHaveBeenCalledTimes(1);
    expect(exportMatchedRowsSpy).not.toHaveBeenCalled();
  });

  test('exportToCSV writes mapped rows via csv-writer', async () => {
    const matchedRows = [
      {
        twitterDetails_postId: '101',
        twitterDetails_postContent: 'Hello',
      },
    ];
    const mapping = {
      postId: 'twitterDetails_postId',
      content: 'twitterDetails_postContent',
    };
    const headers = Object.keys(mapping);

    await pluginAny.exportToCSV(matchedRows, mapping, headers);

    expect(createObjectCsvWriterMock).toHaveBeenCalledTimes(1);
    expect(writeRecordsMocks).toHaveLength(1);
    expect(writeRecordsMocks[0]).toHaveBeenCalledWith([
      { postId: '101', content: 'Hello' },
    ]);
  });

  test('exportAllFileBRows maps every row to File A structure', async () => {
    const dataB = await pluginAny.readFile(fileBPath);
    const mapping = {
      id: 'twitterDetails_postId',
      postContent: 'twitterDetails_postContent',
    };
    const headers = Object.keys(mapping);

    await pluginAny.exportAllFileBRows(dataB.rows.slice(0, 2), mapping, headers);

    expect(writeRecordsMocks).toHaveLength(1);
    const callPayload = writeRecordsMocks[0].mock.calls[0][0] as Array<Record<string, string>>;
    expect(callPayload[0]).toHaveProperty('id');
    expect(callPayload[0]).toHaveProperty('postContent');
  });

  test('ensureCsvBom prepends BOM when missing', () => {
    const tempFile = path.join(sampleDir, 'temp-bom.csv');
    fs.writeFileSync(tempFile, 'header1,header2\nvalue1,value2');

    pluginAny.ensureCsvBom(tempFile);

    const buffer = fs.readFileSync(tempFile);
    expect(buffer[0]).toBe(0xef);
    expect(buffer[1]).toBe(0xbb);
    expect(buffer[2]).toBe(0xbf);

    fs.unlinkSync(tempFile);
  });

  test('ensureCsvBom leaves existing BOM intact', () => {
    const tempFile = path.join(sampleDir, 'temp-existing-bom.csv');
    const content = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from('header1,header2\nvalue1,value2'),
    ]);
    fs.writeFileSync(tempFile, content);

    pluginAny.ensureCsvBom(tempFile);

    const buffer = fs.readFileSync(tempFile);
    expect(buffer.slice(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(buffer.length).toBe(content.length);

    fs.unlinkSync(tempFile);
  });

  test('startWizard manual flow orchestrates comparison pipeline', async () => {
    const selectFileSpy = jest
      .spyOn(pluginAny, 'selectFile')
      .mockResolvedValueOnce('fileA.csv')
      .mockResolvedValueOnce('fileB.csv');
    const readFileSpy = jest
      .spyOn(pluginAny, 'readFile')
      .mockResolvedValueOnce({ headers: ['id'], rows: [{ id: '1' }] })
      .mockResolvedValueOnce({ headers: ['twitterId'], rows: [{ twitterId: '1' }] });
    const checkConfigSpy = jest.spyOn(pluginAny, 'checkForExistingConfig').mockResolvedValue(null);
    const performComparisonSpy = jest.spyOn(pluginAny, 'performDataComparison').mockResolvedValue({
      matchedRows: [{ twitterId: '1' }],
      unmatchedRows: [],
      fieldMapping: {},
      fileAFields: [1],
      fileBFields: [1],
    });
    const performFieldMappingSpy = jest
      .spyOn(pluginAny, 'performFieldMapping')
      .mockResolvedValue({ id: 'twitterId' });
    const saveConfigPromptSpy = jest.spyOn(pluginAny, 'saveConfigPrompt').mockResolvedValue(undefined);
    const handleExportChoiceSpy = jest.spyOn(pluginAny, 'handleExportChoice').mockResolvedValue(undefined);
    const showCompletionMenuSpy = jest.spyOn(pluginAny, 'showCompletionMenu').mockResolvedValue(undefined);

    await pluginAny.startWizard();

    expect(selectFileSpy).toHaveBeenCalledTimes(2);
    expect(readFileSpy).toHaveBeenCalledTimes(2);
    expect(checkConfigSpy).toHaveBeenCalledTimes(1);
    expect(performComparisonSpy).toHaveBeenCalledTimes(1);
    expect(performFieldMappingSpy).toHaveBeenCalledTimes(1);
    expect(saveConfigPromptSpy).toHaveBeenCalledWith([1], [1], { id: 'twitterId' });
    expect(handleExportChoiceSpy).toHaveBeenCalledTimes(1);
    expect(showCompletionMenuSpy).toHaveBeenCalledTimes(1);
  });

  test('startWizard uses saved configuration when available', async () => {
    jest
      .spyOn(pluginAny, 'selectFile')
      .mockResolvedValueOnce('fileA.csv')
      .mockResolvedValueOnce('fileB.csv');
    jest
      .spyOn(pluginAny, 'readFile')
      .mockResolvedValueOnce({ headers: ['id'], rows: [{ id: '1' }] })
      .mockResolvedValueOnce({ headers: ['twitterId'], rows: [{ twitterId: '1' }] });

    const config = {
      fileAFields: [1],
      fileBFields: [1],
      fieldMapping: { id: 'twitterId' },
      createdAt: new Date().toISOString(),
    };

    jest.spyOn(pluginAny, 'checkForExistingConfig').mockResolvedValue(config);
    promptMock.mockResolvedValueOnce({ useConfig: true });

    const performDataComparisonWithConfigSpy = jest
      .spyOn(pluginAny, 'performDataComparisonWithConfig')
      .mockResolvedValue({ matchedRows: [], unmatchedRows: [], fieldMapping: config.fieldMapping });
    const handleExportChoiceSpy = jest.spyOn(pluginAny, 'handleExportChoice').mockResolvedValue(undefined);
    const showCompletionMenuSpy = jest.spyOn(pluginAny, 'showCompletionMenu').mockResolvedValue(undefined);

    await pluginAny.startWizard();

    expect(performDataComparisonWithConfigSpy).toHaveBeenCalledWith(
      { headers: ['id'], rows: [{ id: '1' }] },
      { headers: ['twitterId'], rows: [{ twitterId: '1' }] },
      config
    );
    expect(handleExportChoiceSpy).toHaveBeenCalledTimes(1);
    expect(showCompletionMenuSpy).toHaveBeenCalledTimes(1);
  });

  test('startWizard falls back to manual flow when saved configuration is invalid', async () => {
    jest
      .spyOn(pluginAny, 'selectFile')
      .mockResolvedValueOnce('fileA.csv')
      .mockResolvedValueOnce('fileB.csv');

    jest
      .spyOn(pluginAny, 'readFile')
      .mockResolvedValueOnce({ headers: ['id'], rows: [{ id: '1' }] })
      .mockResolvedValueOnce({ headers: ['twitterId'], rows: [{ twitterId: '1' }] });

    jest.spyOn(pluginAny, 'checkForExistingConfig').mockResolvedValue({
      fileAFields: [1],
      fileBFields: [1, 2],
      fieldMapping: { id: 'twitterId' },
      createdAt: new Date().toISOString(),
    });

    promptMock.mockResolvedValueOnce({ useConfig: true });

    const performDataComparisonWithConfigSpy = jest
      .spyOn(pluginAny, 'performDataComparisonWithConfig')
      .mockResolvedValue({ matchedRows: [], unmatchedRows: [], fieldMapping: {} });
    const performDataComparisonSpy = jest
      .spyOn(pluginAny, 'performDataComparison')
      .mockResolvedValue({
        matchedRows: [],
        unmatchedRows: [],
        fieldMapping: {},
        fileAFields: [1],
        fileBFields: [1],
      });
    const performFieldMappingSpy = jest
      .spyOn(pluginAny, 'performFieldMapping')
      .mockResolvedValue({ id: 'twitterId' });
    const saveConfigPromptSpy = jest.spyOn(pluginAny, 'saveConfigPrompt').mockResolvedValue(undefined);
    const handleExportChoiceSpy = jest.spyOn(pluginAny, 'handleExportChoice').mockResolvedValue(undefined);
    const showCompletionMenuSpy = jest.spyOn(pluginAny, 'showCompletionMenu').mockResolvedValue(undefined);

    await pluginAny.startWizard();

    expect(performDataComparisonWithConfigSpy).not.toHaveBeenCalled();
    expect(performDataComparisonSpy).toHaveBeenCalledTimes(1);
    expect(performFieldMappingSpy).toHaveBeenCalledTimes(1);
    expect(saveConfigPromptSpy).toHaveBeenCalledTimes(1);
    expect(handleExportChoiceSpy).toHaveBeenCalledTimes(1);
    expect(showCompletionMenuSpy).toHaveBeenCalledTimes(1);
  });

  test('startWizard logs and shows footer when an error is thrown', async () => {
    const showPluginFooterSpy = jest.spyOn(pluginAny, 'showPluginFooter').mockResolvedValue(undefined);
    jest.spyOn(pluginAny, 'selectFile').mockRejectedValue(new Error('boom'));

    await pluginAny.startWizard();

    expect(showPluginFooterSpy).toHaveBeenCalledTimes(1);
  });
});
