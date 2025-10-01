import { BasePlugin } from '../core/base-plugin';
import { UIUtils } from '../utils/ui-utils';
import { CLI_CONFIG } from '../utils/constants';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class UpdatePlugin extends BasePlugin {
  name = 'Update Tool';
  description = 'Update TCMA CLI Tools to latest version';
  commands = ['update', 'u'];

  async execute(command: string, args?: string[]): Promise<void> {
    await this.showUpdateMenu();
  }

  private async showUpdateMenu(): Promise<void> {
    this.showPluginHeader('Update Tool');

    try {
      // Show current version
      UIUtils.showInfoSection('Current Version', [CLI_CONFIG.VERSION]);

      // Check for updates via GitHub API
      UIUtils.showLoading('Checking for updates');
      const updateInfo = await this.checkForUpdates();

      if (updateInfo.hasUpdate) {
        UIUtils.showSuccess('Update available!');
        UIUtils.showInfoSection('Latest Version', [updateInfo.latestVersion]);

        UIUtils.showCommandSection('Update Instructions', [
          '1. Run: npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git',
          '2. Or run: npm update -g tcma-cli-tools'
        ]);

        UIUtils.showNote('Make sure to backup your configuration before updating.');
      } else {
        UIUtils.showSuccess('You are running the latest version!');
        UIUtils.showInfoSection('Status', ['No updates available at this time.']);
      }

      // Show manual update commands
      this.showUpdateCommands();

      // Show update sources
      UIUtils.showInfoSection('Update Sources', [
        `GitHub: ${CLI_CONFIG.REPOSITORY}`,
        `NPM: ${CLI_CONFIG.NPM_URL}`
      ]);

    } catch (error) {
      UIUtils.showError('Error checking for updates');
      this.log(`Error: ${error}`, 'error');
    }

    await this.showPluginFooter();
  }

  /**
   * Check for updates via GitHub API
   */
  private async checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion: string; releaseInfo?: any }> {
    try {
      // Get latest release from GitHub API
      const response = await this.fetchFromGitHub('https://api.github.com/repos/dinhtrananhthuna/tcma-cli-tools/releases/latest');

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const release: any = await response.json();
      const latestVersion = release.tag_name?.replace(/^v/i, '') || '';

      this.log(`Latest version found: ${latestVersion}`, 'info');

      return {
        hasUpdate: this.compareVersions(latestVersion, CLI_CONFIG.VERSION) > 0,
        latestVersion,
        releaseInfo: release
      };
    } catch (error) {
      this.log(`Failed to check updates: ${error}`, 'warning');
      // Fallback to current version if API fails
      return {
        hasUpdate: false,
        latestVersion: CLI_CONFIG.VERSION
      };
    }
  }

  /**
   * Fetch from GitHub API with proper headers
   */
  private async fetchFromGitHub(url: string): Promise<Response> {
    const https = await import('https');
    const { URL } = await import('url');

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': `${CLI_CONFIG.NAME}/${CLI_CONFIG.VERSION}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Create a Response-like object
          resolve({
            ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
            status: res.statusCode ?? 0,
            json: async () => JSON.parse(data),
            text: async () => data
          } as Response);
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('GitHub API request timeout'));
      });
      req.end();
    });
  }

  /**
   * Compare semantic versions
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    const normalize = (version: string): number[] => {
      return version.split('.')
        .map(part => parseInt(part.replace(/[^0-9]/g, ''), 10))
        .filter(part => !isNaN(part));
    };

    const parts1 = normalize(v1);
    const parts2 = normalize(v2);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }
}
