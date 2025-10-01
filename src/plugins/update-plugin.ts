import { BasePlugin } from '../core/base-plugin';
import { UIUtils } from '../utils/ui-utils';
import { CLI_CONFIG } from '../utils/constants';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface SystemInfo {
  platform: string;
  nodeVersion: string;
  npmVersion: string;
  npmPrefix: string;
  currentUser: string;
  isRoot: boolean;
}

interface PermissionCheck {
  hasPermission: boolean;
  needsSudo: boolean;
  npmPrefix: string;
}

export class UpdatePlugin extends BasePlugin {
  name = 'Update Tool';
  description = 'Update TCMA CLI Tools to latest version';
  commands = ['update', 'u'];

  async execute(command: string, args?: string[]): Promise<void> {
    await this.showUpdateMenu();
  }

  /**
   * Get system information for diagnostics
   */
  private async getSystemInfo(): Promise<SystemInfo> {
    try {
      const { stdout: nodeVersion } = await execAsync('node --version');
      const { stdout: npmVersion } = await execAsync('npm --version');
      const { stdout: npmPrefix } = await execAsync('npm config get prefix');
      const { stdout: whoami } = await execAsync('whoami');
      
      return {
        platform: process.platform,
        nodeVersion: nodeVersion.trim(),
        npmVersion: npmVersion.trim(),
        npmPrefix: npmPrefix.trim(),
        currentUser: whoami.trim(),
        isRoot: whoami.trim() === 'root'
      };
    } catch (error) {
      this.log(`Failed to get system info: ${error}`, 'warning');
      return {
        platform: process.platform,
        nodeVersion: 'unknown',
        npmVersion: 'unknown',
        npmPrefix: 'unknown',
        currentUser: 'unknown',
        isRoot: false
      };
    }
  }

  /**
   * Show system diagnostics
   */
  private async showSystemDiagnostics(): Promise<void> {
    const systemInfo = await this.getSystemInfo();
    
    UIUtils.showInfoSection('System Diagnostics', [
      `Platform: ${systemInfo.platform}`,
      `Node.js: ${systemInfo.nodeVersion}`,
      `NPM: ${systemInfo.npmVersion}`,
      `NPM Prefix: ${systemInfo.npmPrefix}`,
      `Current User: ${systemInfo.currentUser}`,
      `Is Root: ${systemInfo.isRoot ? 'Yes' : 'No'}`
    ]);
  }

  /**
   * Check npm permissions for global installation
   */
  private async checkNpmPermissions(): Promise<PermissionCheck> {
    try {
      const { stdout: npmPrefix } = await execAsync('npm config get prefix');
      const prefixPath = npmPrefix.trim();
      
      // Check if we can write to npm prefix
      const testPath = path.join(prefixPath, 'test-permission-' + Date.now());
      try {
        fs.writeFileSync(testPath, 'test');
        fs.unlinkSync(testPath);
        return { hasPermission: true, needsSudo: false, npmPrefix: prefixPath };
      } catch {
        return { hasPermission: false, needsSudo: true, npmPrefix: prefixPath };
      }
    } catch (error) {
      this.log(`Failed to check npm permissions: ${error}`, 'warning');
      return { hasPermission: false, needsSudo: true, npmPrefix: '' };
    }
  }

  private async showUpdateMenu(): Promise<void> {
    this.showPluginHeader('Update Tool');

    try {
      // Show current version
      UIUtils.showInfoSection('Current Version', [CLI_CONFIG.VERSION]);

      // Show system diagnostics
      await this.showSystemDiagnostics();

      // Check for updates via GitHub API
      UIUtils.showLoading('Checking for updates');
      const updateInfo = await this.checkForUpdates();

      if (updateInfo.hasUpdate) {
        UIUtils.showSuccess('Update available!');
        UIUtils.showInfoSection('Latest Version', [updateInfo.latestVersion]);

        // Show release notes if available
        if (updateInfo.releaseInfo?.body) {
          UIUtils.showInfoSection('Release Notes', [updateInfo.releaseInfo.body.trim().substring(0, 500) + (updateInfo.releaseInfo.body.length > 500 ? '...' : '')]);
        }

        // Ask user if they want to update
        const { shouldUpdate } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldUpdate',
            message: `Would you like to update to version ${updateInfo.latestVersion}?`,
            default: true
          }
        ]);

        if (shouldUpdate) {
          await this.performUpdate(updateInfo.latestVersion);
        } else {
          UIUtils.showInfoSection('Status', ['Update cancelled.']);

          // Show manual update commands anyway
          UIUtils.showCommandSection('Manual Update Commands', [
            'npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git'
          ]);
        }
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

  /**
   * Handle permission denied scenario
   */
  private async handlePermissionDenied(targetVersion: string, permissionCheck: PermissionCheck): Promise<void> {
    const platform = process.platform;
    
    if (platform === 'linux' || platform === 'darwin') {
      UIUtils.showInfoSection('Permission Issue Detected', [
        `NPM prefix (${permissionCheck.npmPrefix}) is not writable by current user.`,
        '',
        'This is a common issue on Unix-like systems.'
      ]);

      const { useSudo } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useSudo',
          message: chalk.yellow('Would you like to try updating with sudo?'),
          default: true
        }
      ]);
      
      if (useSudo) {
        await this.performSudoUpdate(targetVersion);
        return;
      }
    }
    
    // Show alternative solutions
    await this.showPermissionSolutions(permissionCheck);
  }

  /**
   * Perform update with sudo
   */
  private async performSudoUpdate(targetVersion: string): Promise<void> {
    UIUtils.showInfoSection('Sudo Update', [
      `Updating to version ${targetVersion} with sudo...`,
      'You may be prompted for your password.',
      '',
      '⚠️  Please do not interrupt this process.'
    ]);

    try {
      const command = 'npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git';
      
      // Use spawn instead of exec for better sudo handling
      const child = spawn('sudo', ['npm', 'install', '-g', 'git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git'], {
        stdio: 'inherit'
      });

      await new Promise<void>((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Sudo update failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          reject(error);
        });
      });

      // Verify the update
      const updateSuccess = await this.verifyUpdate(targetVersion);
      
      if (updateSuccess) {
        UIUtils.showSuccess('✅ Update completed successfully with sudo!');
        
        UIUtils.showInfoSection('Installation Details', [
          `New version: ${targetVersion}`,
          'Source: GitHub repository (via sudo)',
          '',
          '🔄 Please restart the CLI to use the new version.',
          '',
          'You can restart by:',
          '1. Closing this process (Ctrl+C or ESC)',
          '2. Running: tcmatools'
        ]);
      } else {
        UIUtils.showError('❌ Update verification failed!');
        await this.showManualInstructions();
      }
      
    } catch (error) {
      console.log();
      UIUtils.showError('❌ Sudo update failed!');
      this.log(`Sudo update error: ${error}`, 'error');
      await this.showPermissionSolutions({ hasPermission: false, needsSudo: true, npmPrefix: '' });
    }
  }

  /**
   * Show permission solutions
   */
  private async showPermissionSolutions(permissionCheck: PermissionCheck): Promise<void> {
    const solutions = [
      {
        title: 'Fix NPM Permissions (Recommended)',
        description: 'Change ownership of npm directories to current user',
        commands: [
          'sudo chown -R $(whoami) ~/.npm',
          'sudo chown -R $(whoami) /usr/local/lib/node_modules',
          'sudo chown -R $(whoami) /usr/local/bin'
        ]
      },
      {
        title: 'Configure NPM for User Directory',
        description: 'Set up npm to use a user-specific directory',
        commands: [
          'mkdir ~/.npm-global',
          'npm config set prefix "~/.npm-global"',
          'echo "export PATH=~/.npm-global/bin:$PATH" >> ~/.bashrc',
          'source ~/.bashrc'
        ]
      },
      {
        title: 'Use Node Version Manager (NVM)',
        description: 'Install and use NVM for better Node.js management',
        commands: [
          'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash',
          'nvm install node',
          'nvm use node'
        ]
      }
    ];

    UIUtils.showInfoSection('Permission Solutions', [
      'Choose one of the following solutions to fix npm permissions:'
    ]);

    const { solution } = await inquirer.prompt([
      {
        type: 'list',
        name: 'solution',
        message: chalk.blue('Select a solution:'),
        choices: [
          ...solutions.map((s, i) => ({ 
            name: `${i + 1}. ${s.title}`, 
            value: i,
            short: s.title
          })),
          { name: '4. Show manual commands only', value: 'manual' },
          { name: '5. Return to main menu', value: 'exit' }
        ]
      }
    ]);

    if (solution === 'exit') {
      return;
    } else if (solution === 'manual') {
      await this.showManualInstructions();
    } else {
      await this.showSolutionSteps(solutions[solution]);
    }
  }

  /**
   * Show solution steps
   */
  private async showSolutionSteps(solution: any): Promise<void> {
    UIUtils.showInfoSection(solution.title, [
      solution.description,
      '',
      'Commands to run:',
      ...solution.commands.map((cmd: string) => `  ${cmd}`),
      '',
      'After running these commands, try updating again.'
    ]);

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: chalk.yellow('Would you like to try updating again?'),
        default: false
      }
    ]);

    if (proceed) {
      // Restart the update process
      await this.showUpdateMenu();
    }
  }

  /**
   * Show manual instructions
   */
  private async showManualInstructions(): Promise<void> {
    UIUtils.showCommandSection('Manual Update Required', [
      'Please run the following command manually:',
      '',
      'npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git',
      '',
      'If permission denied, try with sudo:',
      'sudo npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git',
      '',
      'If the issue persists, check:',
      '1. Your internet connection',
      '2. npm permissions: npm config get prefix',
      '3. GitHub repository access'
    ]);
  }

  /**
   * Verify update was successful
   */
  private async verifyUpdate(targetVersion: string): Promise<boolean> {
    try {
      // Try to get version from the CLI
      const { stdout: currentVersion } = await execAsync('tcmatools --version 2>/dev/null || echo "unknown"', {
        timeout: 5000
      });
      
      if (currentVersion.includes(targetVersion)) {
        return true;
      }
      
      // Fallback: check if the package was updated in npm
      const { stdout: packageInfo } = await execAsync('npm list -g tcma-cli-tools --depth=0 2>/dev/null || echo "not found"', {
        timeout: 5000
      });
      
      return packageInfo.includes(targetVersion);
      
    } catch (error) {
      this.log(`Update verification failed: ${error}`, 'warning');
      return false;
    }
  }

  /**
   * Categorize and analyze update errors
   */
  private categorizeError(error: any): { message: string; canRetry: boolean; suggestRollback: boolean } {
    let message = 'Unknown error occurred';
    let canRetry = false;
    let suggestRollback = false;

    if (error.code === 'ETIMEDOUT') {
      message = 'Installation timed out (2 minutes). This could be due to slow network or large package size.';
      canRetry = true;
    } else if (error.code === 'EACCES') {
      message = 'Permission denied. Your user account doesn\'t have permission to write to npm directories.';
      canRetry = false;
    } else if (error.code === 'ENOENT') {
      message = 'npm command not found. Please ensure Node.js and npm are properly installed.';
      canRetry = false;
    } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      message = 'Network connection error. Please check your internet connection and try again.';
      canRetry = true;
    } else if (error.code === 'E404') {
      message = 'Package not found. The GitHub repository might be unavailable or the URL is incorrect.';
      canRetry = false;
    } else if (error.stderr) {
      if (error.stderr.includes('permission')) {
        message = 'Permission denied. You may need administrator privileges or need to configure npm permissions.';
        canRetry = false;
      } else if (error.stderr.includes('network')) {
        message = 'Network error detected. Please check your internet connection.';
        canRetry = true;
      } else if (error.stderr.includes('git')) {
        message = 'Git-related error. The Git repository might be inaccessible or there might be authentication issues.';
        canRetry = true;
      } else {
        message = `Installation error: ${error.stderr.substring(0, 200)}...`;
        canRetry = true;
      }
    } else if (error.message) {
      message = error.message;
      canRetry = true;
    }

    // Suggest rollback if this was an upgrade attempt that failed
    if (error.code !== 'EACCES' && error.code !== 'ENOENT') {
      suggestRollback = true;
    }

    return { message, canRetry, suggestRollback };
  }

  /**
   * Rollback to previous version if update fails
   */
  private async rollbackUpdate(): Promise<void> {
    const { rollback } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'rollback',
        message: chalk.yellow('Update failed. Would you like to attempt rollback to the previous version?'),
        default: true
      }
    ]);

    if (rollback) {
      UIUtils.showLoading('Attempting to rollback to previous version...');
      
      try {
        // Install the current version (stored in CLI_CONFIG)
        const rollbackCommand = `npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git#${CLI_CONFIG.VERSION}`;
        
        await execAsync(rollbackCommand, {
          timeout: 120000,
          maxBuffer: 1024 * 1024 * 10
        });

        UIUtils.showSuccess('✅ Rollback completed successfully!');
        UIUtils.showInfoSection('Rollback Details', [
          `Rolled back to version: ${CLI_CONFIG.VERSION}`,
          'The previous version has been restored.',
          '',
          '🔄 Please restart the CLI to use the restored version.'
        ]);
        
      } catch (rollbackError) {
        UIUtils.showError('❌ Rollback failed!');
        this.log(`Rollback failed: ${rollbackError}`, 'error');
        
        UIUtils.showCommandSection('Manual Rollback Required', [
          'Please run manually to restore the previous version:',
          '',
          `npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git#${CLI_CONFIG.VERSION}`
        ]);
      }
    }
  }

  /**
   * Perform the update installation
   */
  private async performUpdate(targetVersion: string): Promise<void> {
    // Check permissions first
    const permissionCheck = await this.checkNpmPermissions();
    
    if (!permissionCheck.hasPermission) {
      await this.handlePermissionDenied(targetVersion, permissionCheck);
      return;
    }

    try {
      UIUtils.showInfoSection('Update Status', [
        `Updating to version ${targetVersion}...`,
        'This may take a few moments.',
        '',
        '⚠️  Please do not interrupt this process.'
      ]);

      // Show loading spinner
      UIUtils.showLoading('Installing update from GitHub...');

      try {
        // Execute the npm install command
        const { stdout, stderr } = await execAsync('npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git', {
          timeout: 120000, // 2 minute timeout
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });

        // Clear loading spinner
        console.log();

        // Verify the update
        const updateSuccess = await this.verifyUpdate(targetVersion);
        
        if (updateSuccess) {
          UIUtils.showSuccess('✅ Update completed successfully!');

          UIUtils.showInfoSection('Installation Details', [
            `New version: ${targetVersion}`,
            'Source: GitHub repository',
            '',
            '🔄 Please restart the CLI to use the new version.',
            '',
            'You can restart by:',
            '1. Closing this process (Ctrl+C or ESC)',
            '2. Running: tcmatools'
          ]);

          // Show any npm output if relevant
          if (stdout && stdout.trim()) {
            UIUtils.showInfoSection('Installation Output', [stdout.trim().substring(0, 1000)]);
          }
        } else {
          UIUtils.showError('❌ Update verification failed!');
          await this.rollbackUpdate();
        }

      } catch (installError: any) {
        // Clear loading spinner
        console.log();

        UIUtils.showError('❌ Update installation failed!');

        // Enhanced error handling
        const errorInfo = this.categorizeError(installError);
        
        UIUtils.showInfoSection('Error Details', [errorInfo.message]);

        if (errorInfo.canRetry) {
          const { retry } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'retry',
              message: chalk.yellow('Would you like to try again?'),
              default: false
            }
          ]);

          if (retry) {
            await this.performUpdate(targetVersion);
            return;
          }
        }

        if (errorInfo.suggestRollback) {
          await this.rollbackUpdate();
        } else {
          await this.showManualInstructions();
        }

        // Show stderr if available
        if (installError.stderr && installError.stderr.trim()) {
          UIUtils.showInfoSection('Error Output', [installError.stderr.trim().substring(0, 1000)]);
        }

        this.log(`Installation failed: ${errorInfo.message}`, 'error');
      }

    } catch (error) {
      console.log();
      UIUtils.showError('Unexpected error during update process');
      this.log(`Unexpected error: ${error}`, 'error');

      await this.showManualInstructions();
    }
  }
}
