import { Plugin } from './base-plugin';
import chalk from 'chalk';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async executeCommand(command: string): Promise<void> {
    const commandName = command.toLowerCase().substring(1); // Remove leading '/'

    // Find plugin that handles this command
    for (const plugin of this.plugins.values()) {
      if (plugin.commands.includes(commandName)) {
        try {
          await plugin.execute(commandName);
          return;
        } catch (error) {
          console.error(chalk.red(`Error executing command ${command}:`), error);
          return;
        }
      }
    }

    // Command not found
    console.log(chalk.red(`Command '${command}' not found.`));
    console.log(chalk.yellow('Available commands:'));
    this.showAvailableCommands();
  }

  showAvailableCommands(): void {
    console.log();
    for (const plugin of this.plugins.values()) {
      console.log(chalk.blue(`${plugin.name}:`));
      plugin.commands.forEach(cmd => {
        console.log(chalk.white(`  /${cmd}`) + chalk.gray(` - ${plugin.description}`));
      });
      console.log();
    }
  }

  showPluginInfo(): void {
    console.log(
      chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    );
    console.log(chalk.cyan('                              PLUGIN INFORMATION'));
    console.log(
      chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    );
    console.log();

    for (const plugin of this.plugins.values()) {
      console.log(chalk.green(`📦 ${plugin.name}`));
      console.log(chalk.gray(`   ${plugin.description}`));
      console.log(chalk.white(`   Commands: ${plugin.commands.map(cmd => `/${cmd}`).join(', ')}`));
      console.log();
    }
  }
}
