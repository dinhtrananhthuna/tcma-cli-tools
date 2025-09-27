import { BasePlugin } from '../core/base-plugin';
import chalk from 'chalk';

export class VersionPlugin extends BasePlugin {
  name = 'Version';
  description = 'Show version information';
  commands = ['version', 'v'];

  async execute(command: string, args?: string[]): Promise<void> {
    await this.showVersion();
  }

  private async showVersion(): Promise<void> {
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('                              VERSION INFORMATION'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    
    console.log(chalk.green('📦 TCMA CLI Tools'));
    console.log(chalk.white('   Version: ') + chalk.cyan('1.0.0'));
    console.log(chalk.white('   Description: ') + chalk.gray('Development utilities for TCMA team'));
    console.log(chalk.white('   Author: ') + chalk.gray('TCMA Team'));
    console.log(chalk.white('   License: ') + chalk.gray('MIT'));
    console.log();

    console.log(chalk.green('🔧 System Information'));
    console.log(chalk.white('   Node.js: ') + chalk.cyan(process.version));
    console.log(chalk.white('   Platform: ') + chalk.cyan(process.platform));
    console.log(chalk.white('   Architecture: ') + chalk.cyan(process.arch));
    console.log();

    console.log(chalk.green('📚 Repository'));
    console.log(chalk.white('   GitHub: ') + chalk.blue('https://github.com/tcma-team/tcma-cli-tools'));
    console.log(chalk.white('   Installation: ') + chalk.gray('npm install -g git+https://github.com/tcma-team/tcma-cli-tools.git'));
    console.log();

    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
  }
}
