import chalk from 'chalk';
import { UIUtils } from '../utils/ui-utils';
import { CLI_CONFIG } from '../utils/constants';

export interface Plugin {
  name: string;
  description: string;
  commands: string[];
  execute(command: string, args?: string[]): Promise<void>;
}

export abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract description: string;
  abstract commands: string[];

  abstract execute(command: string, args?: string[]): Promise<void>;

  /**
   * Show plugin header with title
   */
  protected showPluginHeader(title?: string): void {
    UIUtils.clearScreen();
    UIUtils.showSectionHeader(title || this.name);
  }

  /**
   * Show plugin footer and wait for escape
   */
  protected async showPluginFooter(): Promise<void> {
    UIUtils.showEscapeMessage();
    await UIUtils.waitForEscape();
  }

  /**
   * Log message with timestamp
   */
  protected log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    
    switch (type) {
      case 'info':
        console.log(chalk.blue(`[${timestamp}]`), chalk.white(message));
        break;
      case 'success':
        console.log(chalk.blue(`[${timestamp}]`), chalk.green(message));
        break;
      case 'warning':
        console.log(chalk.blue(`[${timestamp}]`), chalk.yellow(message));
        break;
      case 'error':
        console.log(chalk.blue(`[${timestamp}]`), chalk.red(message));
        break;
    }
  }

  /**
   * Sleep utility
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Show version info
   */
  protected showVersionInfo(): void {
    UIUtils.showInfoSection('Version Information', [
      `Current: ${CLI_CONFIG.VERSION}`,
      `Repository: ${CLI_CONFIG.REPOSITORY}`,
      `NPM: ${CLI_CONFIG.NPM_URL}`
    ]);
  }

  /**
   * Show update commands
   */
  protected showUpdateCommands(): void {
    UIUtils.showCommandSection('Update Commands', [
      'npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git',
      'npm update -g tcma-cli-tools'
    ]);
  }
}
