import { UpdatePlugin } from '../src/plugins/update-plugin';
import { CLI_CONFIG } from '../src/utils/constants';

// Mock UI utilities to avoid console output and waiting for input
jest.mock('../src/utils/ui-utils', () => ({
  UIUtils: {
    clearScreen: jest.fn(),
    showSectionHeader: jest.fn(),
    showEscapeMessage: jest.fn(),
    waitForEscape: jest.fn().mockResolvedValue(undefined),
    showInfoSection: jest.fn(),
    showCommandSection: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showLoadingAnimation: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock inquirer prompts to be deterministic
jest.mock('inquirer', () => ({
  __esModule: true,
  default: { prompt: jest.fn() },
  prompt: jest.fn(),
}));

// Mock child_process exec/spawn to avoid real system calls
jest.mock('child_process', () => {
  const mockExec = jest.fn((cmd: string, options: any, cb?: any) => {
    if (typeof options === 'function') {
      cb = options;
    }
    // Provide default stdout for version-related commands
    const stdout = cmd.includes('node --version')
      ? 'v18.0.0\n'
      : cmd.includes('npm --version')
      ? '10.0.0\n'
      : cmd.includes('npm config get prefix')
      ? '/usr/local\n'
      : cmd.includes('whoami')
      ? 'tester\n'
      : '';
    cb && cb(null, { stdout, stderr: '' });
  });

  const mockSpawn = jest.fn(() => {
    const listeners: Record<string, Function[]> = { close: [], error: [] };
    return {
      on: (event: 'close' | 'error', handler: Function) => {
        listeners[event].push(handler);
        // Auto-succeed close shortly after
        if (event === 'close') {
          setImmediate(() => handler(0));
        }
        return undefined as any;
      },
      // For completeness if code references stdio
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
    } as any;
  });

  return { exec: mockExec, spawn: mockSpawn };
});

describe('UpdatePlugin - Unit Tests', () => {
  let plugin: UpdatePlugin;

  beforeEach(() => {
    plugin = new UpdatePlugin();
    jest.clearAllMocks();
  });

  test('compareVersions should order semantic versions correctly', () => {
    const cmp = (plugin as any).compareVersions.bind(plugin);
    expect(cmp('1.2.0', '1.1.9')).toBe(1);
    expect(cmp('1.2.0', '1.2.0')).toBe(0);
    expect(cmp('1.2.0', '1.2.1')).toBe(-1);
    expect(cmp('2.0.0', '1.99.99')).toBe(1);
    expect(cmp('1.2', '1.2.0')).toBe(0);
    expect(cmp('1.2.10', '1.2.2')).toBe(1);
  });

  test('checkForUpdates returns hasUpdate=true when GitHub version is newer', async () => {
    const spyFetch = jest
      .spyOn(plugin as any, 'fetchFromGitHub')
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ tag_name: 'v9.9.9', body: 'notes' }),
        text: async () => 'body',
      } as any);

    const res = await (plugin as any).checkForUpdates();
    expect(spyFetch).toHaveBeenCalled();
    expect(res.hasUpdate).toBe(true);
    expect(res.latestVersion).toBe('9.9.9');
  });

  test('checkForUpdates falls back when GitHub API returns non-success status', async () => {
    jest.spyOn(plugin as any, 'fetchFromGitHub').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
      text: async () => 'error',
    } as any);

    const res = await (plugin as any).checkForUpdates();
    expect(res.hasUpdate).toBe(false);
    expect(res.latestVersion).toBe(CLI_CONFIG.VERSION);
  });

  test('checkForUpdates falls back when GitHub API fails', async () => {
    jest.spyOn(plugin as any, 'fetchFromGitHub').mockRejectedValue(new Error('network'));
    const res = await (plugin as any).checkForUpdates();
    expect(res.hasUpdate).toBe(false);
    expect(res.latestVersion).toBe(CLI_CONFIG.VERSION);
  });

  test('execute flows through showUpdateMenu and finishes without update when user declines', async () => {
    const inquirer = require('inquirer');
    (inquirer.default.prompt as jest.Mock).mockResolvedValue({ shouldUpdate: false });

    jest
      .spyOn(plugin as any, 'checkForUpdates')
      .mockResolvedValue({ hasUpdate: true, latestVersion: '9.9.9', releaseInfo: { body: '...' } });

    const ui = require('../src/utils/ui-utils');

    await plugin.execute('update');

    // Expect it to show sections and not throw
    expect(ui.UIUtils.showInfoSection).toHaveBeenCalled();
    expect(ui.UIUtils.waitForEscape).toHaveBeenCalled();
  });

  test('performUpdate succeeds when permissions ok and verification passes', async () => {
    jest
      .spyOn(plugin as any, 'checkNpmPermissions')
      .mockResolvedValue({ hasPermission: true, needsSudo: false, npmPrefix: '/usr/local' });

    jest.spyOn(plugin as any, 'verifyUpdate').mockResolvedValue(true);

    const ui = require('../src/utils/ui-utils');

    await (plugin as any).performUpdate('9.9.9');

    expect(ui.UIUtils.showSuccess).toHaveBeenCalled();
  });

  test('performUpdate delegates to handlePermissionDenied when permissions missing', async () => {
    const permissionInfo = { hasPermission: false, needsSudo: true, npmPrefix: '/usr/local' };
    jest.spyOn(plugin as any, 'checkNpmPermissions').mockResolvedValue(permissionInfo);
    const handleSpy = jest
      .spyOn(plugin as any, 'handlePermissionDenied')
      .mockResolvedValue(undefined);

    await (plugin as any).performUpdate('9.9.9');

    expect(handleSpy).toHaveBeenCalledWith('9.9.9', permissionInfo);
  });

  test('performUpdate triggers rollback when verification fails', async () => {
    jest
      .spyOn(plugin as any, 'checkNpmPermissions')
      .mockResolvedValue({ hasPermission: true, needsSudo: false, npmPrefix: '/usr/local' });

    jest.spyOn(plugin as any, 'verifyUpdate').mockResolvedValue(false);
    const rollbackSpy = jest.spyOn(plugin as any, 'rollbackUpdate').mockResolvedValue(undefined);

    await (plugin as any).performUpdate('9.9.9');
    expect(rollbackSpy).toHaveBeenCalled();
  });

  test('handlePermissionDenied uses sudo path when user agrees', async () => {
    const inquirer = require('inquirer');
    (inquirer.default.prompt as jest.Mock).mockResolvedValue({ useSudo: true });
    const performSudoUpdateSpy = jest
      .spyOn(plugin as any, 'performSudoUpdate')
      .mockResolvedValue(undefined);

    await (plugin as any).handlePermissionDenied('9.9.9', {
      hasPermission: false,
      needsSudo: true,
      npmPrefix: '/usr/local',
    });

    expect(performSudoUpdateSpy).toHaveBeenCalledWith('9.9.9');
  });

  test('handlePermissionDenied shows solutions when user does not choose sudo', async () => {
    const inquirer = require('inquirer');
    (inquirer.default.prompt as jest.Mock).mockResolvedValue({ useSudo: false });
    const solutionsSpy = jest
      .spyOn(plugin as any, 'showPermissionSolutions')
      .mockResolvedValue(undefined);

    await (plugin as any).handlePermissionDenied('9.9.9', {
      hasPermission: false,
      needsSudo: true,
      npmPrefix: '/usr/local',
    });

    expect(solutionsSpy).toHaveBeenCalled();
  });

  test('performSudoUpdate runs sudo install and verifies success', async () => {
    const spawnModule = require('child_process');
    const spawnMock = spawnModule.spawn as jest.Mock;
    const ui = require('../src/utils/ui-utils');

    jest.spyOn(plugin as any, 'verifyUpdate').mockResolvedValue(true);

    await (plugin as any).performSudoUpdate('9.9.9');

    expect(spawnMock).toHaveBeenCalledWith(
      'sudo',
      ['npm', 'install', '-g', 'git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git'],
      { stdio: 'inherit' }
    );
    expect(ui.UIUtils.showSuccess).toHaveBeenCalledWith('[+] Update completed successfully with sudo!');
  });

  test('verifyUpdate returns true when CLI version matches target', async () => {
    jest.spyOn(plugin as any, 'tryGetCliVersion').mockResolvedValue('9.9.9');
    const runCommandSpy = jest.spyOn(plugin as any, 'runCommand');

    const result = await (plugin as any).verifyUpdate('9.9.9');

    expect(result).toBe(true);
    expect(runCommandSpy).not.toHaveBeenCalled();
  });

  test('verifyUpdate checks npm list when CLI version unavailable', async () => {
    jest.spyOn(plugin as any, 'tryGetCliVersion').mockResolvedValue(null);
    jest.spyOn(plugin as any, 'runCommand').mockResolvedValue({
      stdout: JSON.stringify({
        dependencies: {
          'tcma-cli-tools': {
            version: '9.9.9',
          },
        },
      }),
      stderr: '',
      exitCode: 0,
    });

    const result = await (plugin as any).verifyUpdate('9.9.9');

    expect(result).toBe(true);
  });

  test('verifyUpdate returns false when npm list output lacks version', async () => {
    jest.spyOn(plugin as any, 'tryGetCliVersion').mockResolvedValue(null);
    jest.spyOn(plugin as any, 'runCommand').mockResolvedValue({
      stdout: JSON.stringify({ dependencies: {} }),
      stderr: '',
      exitCode: 1,
    });

    const result = await (plugin as any).verifyUpdate('9.9.9');

    expect(result).toBe(false);
  });
});
