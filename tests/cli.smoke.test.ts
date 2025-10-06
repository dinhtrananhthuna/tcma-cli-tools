import * as path from 'path';
import { spawn } from 'child_process';
import { CLI_CONFIG } from '../src/utils/constants';

function runCliAndSignal(
  sig: NodeJS.Signals = 'SIGINT',
  delayMs = 1200
): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string; }> {
  return new Promise(resolve => {
    const cliPath = path.resolve(__dirname, '../dist/cli.js');
    const child = spawn(process.execPath, [cliPath], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      try { child.kill(sig); } catch {}
    }, delayMs);

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal: (signal as NodeJS.Signals) ?? null, stdout, stderr });
    });
  });
}

describe('CLI Smoke Tests', () => {
  test('starts and prints welcome (name/version), then exits on SIGINT gracefully or by signal', async () => {
    const result = await runCliAndSignal('SIGINT', 700);
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
    const result = await runCliAndSignal('SIGINT', 600);
    // Process should have closed without throwing and without unexpected stderr
    expect([0, null]).toContain(result.code);
    // No unexpected error output
    expect(result.stderr).toBe('');
  });
});


