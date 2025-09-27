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

    // Interactive prompt
    console.log(chalk.cyan('Press any key to return to main menu...'));
    
    // Wait for user input (simplified for CLI)
    setTimeout(() => {
      console.clear();
      this.showMainMenu();
    }, 2000);
  }

  private showMainMenu(): void {
    console.log(chalk.cyan(figlet.textSync('TCMA CLI', { 
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })));
    
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green('                    Welcome to TCMA CLI Tools v1.0.0'));
    console.log(chalk.green('                    Development utilities for TCMA team'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.blue('Available Commands:'));
    console.log();
    console.log(chalk.white('  /help          ') + chalk.gray('Show help and available commands'));
    console.log(chalk.white('  /version       ') + chalk.gray('Show version information'));
    console.log(chalk.white('  /plugins       ') + chalk.gray('List all available plugins'));
    console.log();
    console.log(chalk.yellow('Usage: tcmatools <command>'));
    console.log(chalk.gray('Example: tcmatools /help'));
    console.log();
    console.log(chalk.cyan('Type a command or press Ctrl+C to exit'));
  }
}
