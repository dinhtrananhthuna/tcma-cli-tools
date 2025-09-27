import { BasePlugin } from '../core/base-plugin';
import chalk from 'chalk';

export class PluginsPlugin extends BasePlugin {
  name = 'Plugins';
  description = 'List all available plugins';
  commands = ['plugins', 'p'];

  async execute(command: string, args?: string[]): Promise<void> {
    await this.showPlugins();
  }

  private async showPlugins(): Promise<void> {
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('                              AVAILABLE PLUGINS'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();

    // Built-in plugins
    console.log(chalk.green('🔌 Built-in Plugins:'));
    console.log();

    // Help Plugin
    console.log(chalk.blue('📖 Help Plugin'));
    console.log(chalk.white('   Commands: ') + chalk.cyan('/help, /h, /?'));
    console.log(chalk.white('   Description: ') + chalk.gray('Show help information and available commands'));
    console.log();

    // Version Plugin
    console.log(chalk.blue('📦 Version Plugin'));
    console.log(chalk.white('   Commands: ') + chalk.cyan('/version, /v'));
    console.log(chalk.white('   Description: ') + chalk.gray('Show version information'));
    console.log();

    // Plugins Plugin
    console.log(chalk.blue('🔌 Plugins Plugin'));
    console.log(chalk.white('   Commands: ') + chalk.cyan('/plugins, /p'));
    console.log(chalk.white('   Description: ') + chalk.gray('List all available plugins'));
    console.log();

    // Plugin System Info
    console.log(chalk.green('🛠️  Plugin System:'));
    console.log(chalk.gray('   TCMA CLI Tools uses a modular plugin architecture.'));
    console.log(chalk.gray('   Each plugin can register multiple commands and'));
    console.log(chalk.gray('   provide specific functionality.'));
    console.log();

    console.log(chalk.green('📝 Adding New Plugins:'));
    console.log(chalk.gray('   1. Create a new plugin class extending BasePlugin'));
    console.log(chalk.gray('   2. Implement the required methods'));
    console.log(chalk.gray('   3. Register the plugin in the PluginManager'));
    console.log();

    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
  }
}
