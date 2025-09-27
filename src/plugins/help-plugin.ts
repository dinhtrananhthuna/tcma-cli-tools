import { BasePlugin } from '../core/base-plugin';
import chalk from 'chalk';
import figlet from 'figlet';

export class HelpPlugin extends BasePlugin {
  name = 'Help';
  description = 'Show help information and available commands';
  commands = ['help', 'h', '?'];

  async execute(command: string, args?: string[]): Promise<void> {
    await this.showHelp();
  }

  private async showHelp(): Promise<void> {
    console.clear();
    
    // ASCII Art
    console.log(chalk.cyan(figlet.textSync('TCMA HELP', { 
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })));
    
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green('                    TCMA CLI Tools - Help & Documentation'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();

    // Basic Usage
    console.log(chalk.blue('📖 BASIC USAGE:'));
    console.log(chalk.white('  tcmatools                    ') + chalk.gray('Show main menu'));
    console.log(chalk.white('  tcmatools <command>          ') + chalk.gray('Execute a command'));
    console.log(chalk.white('  tcmatools /help              ') + chalk.gray('Show this help'));
    console.log();

    // Available Commands
    console.log(chalk.blue('🔧 AVAILABLE COMMANDS:'));
    console.log(chalk.white('  /help, /h, /?               ') + chalk.gray('Show help information'));
    console.log(chalk.white('  /version, /v                ') + chalk.gray('Show version information'));
    console.log(chalk.white('  /plugins, /p                ') + chalk.gray('List all available plugins'));
    console.log();

    // Examples
    console.log(chalk.blue('💡 EXAMPLES:'));
    console.log(chalk.white('  tcmatools /help             ') + chalk.gray('Show help'));
    console.log(chalk.white('  tcmatools /version          ') + chalk.gray('Check version'));
    console.log(chalk.white('  tcmatools /plugins          ') + chalk.gray('List plugins'));
    console.log();

    // Plugin System
    console.log(chalk.blue('🔌 PLUGIN SYSTEM:'));
    console.log(chalk.gray('  TCMA CLI Tools uses a plugin-based architecture.'));
    console.log(chalk.gray('  Each command is implemented as a plugin that can be'));
    console.log(chalk.gray('  easily extended and customized.'));
    console.log();

    // Development Info
    console.log(chalk.blue('🛠️  DEVELOPMENT:'));
    console.log(chalk.gray('  Repository: https://github.com/tcma-team/tcma-cli-tools'));
    console.log(chalk.gray('  Version: 1.0.0'));
    console.log(chalk.gray('  Node.js: >=16.0.0'));
    console.log();

    // Footer
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green('  For more information, visit: https://github.com/tcma-team/tcma-cli-tools'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();

    console.log();
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
  }
}
