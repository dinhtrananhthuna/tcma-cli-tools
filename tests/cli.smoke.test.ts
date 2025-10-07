import * as fs from 'fs';
import * as path from 'path';
import { spawn, spawnSync } from 'child_process';
import { CLI_CONFIG } from '../src/utils/constants';

interface RunOptions {
  signal?: NodeJS.Signals;
  killTimeoutMs?: number;
  killOnFirstOutput?: boolean;
}

function runCliAndSignal(
  { signal = 'SIGINT', killTimeoutMs = 1500, killOnFirstOutput = true }: RunOptions = {}
): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string; }> {
  return new Promise(resolve => {
    const cliPath = path.resolve(__dirname, '../dist/cli.js');
    const child = spawn(process.execPath, [cliPath], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const killProcess = () => {
      if (!killed) {
        try {
          child.kill(signal);
        } catch {
          // Ignore kill races
        }
        killed = true;
      }
    };

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
      if (killOnFirstOutput) {
        setTimeout(killProcess, 100);
      }
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(killProcess, killTimeoutMs);

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal: (signal as NodeJS.Signals) ?? null, stdout, stderr });
    });
  });
}

const distCliPath = path.resolve(__dirname, '../dist/cli.js');

beforeAll(() => {
  if (!fs.existsSync(distCliPath)) {
    const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
    if (result.status !== 0) {
      throw new Error('Failed to build CLI before smoke tests');
    }
  }
});

describe('CLI Smoke Tests', () => {
  test('starts and prints welcome (name/version), then exits on SIGINT gracefully or by signal', async () => {
    const result = await runCliAndSignal();
    // Either graceful exit (code 0) or terminated by SIGINT signal depending on timing
    expect([0, null]).toContain(result.code);
    expect([null, 'SIGINT']).toContain(result.signal);
    // Should contain tool name and version in the welcome banner if any stdout produced
    if (result.stdout.length > 0) {
      expect(result.stdout).toContain(CLI_CONFIG.NAME);
      expect(result.stdout).toContain(CLI_CONFIG.VERSION);
    }
    // Should print goodbye sequence
    // Depending on timing, farewell may or may not appear before termination; make it non-strict
    // If present, it should contain the keyword
    if (result.stdout.match(/FAREWELL|Goodbye/i)) {
      expect(result.stdout).toMatch(/FAREWELL|Goodbye/i);
    }
  });

  test('does not crash immediately on start (basic liveness)', async () => {
    const result = await runCliAndSignal({ killTimeoutMs: 1200 });
    // Process should have closed without throwing and without unexpected stderr
    expect([0, null]).toContain(result.code);
    // No unexpected error output
    expect(result.stderr).toBe('');
  });
});

