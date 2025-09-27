#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { PluginManager } from './core/plugin-manager';
import { HelpPlugin } from './plugins/help-plugin';
import { VersionPlugin } from './plugins/version-plugin';
import { PluginsPlugin } from './plugins/plugins-plugin';

const program = new Command();

// ASCII Art Welcome
function showWelcome() {
  console.clear();
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
}

// Initialize CLI
async function initializeCLI() {
  showWelcome();
  
  // Initialize plugin manager
  const pluginManager = new PluginManager();
  
  // Register built-in plugins
  pluginManager.registerPlugin(new HelpPlugin());
  pluginManager.registerPlugin(new VersionPlugin());
  pluginManager.registerPlugin(new PluginsPlugin());
  
  // Check if command provided
  if (process.argv.length > 2) {
    const command = process.argv[2];
    if (command.startsWith('/')) {
      await pluginManager.executeCommand(command);
      return;
    }
  }
  
  // Show menu if no command provided
  showMenu();
}

// Show interactive menu
function showMenu() {
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled rejection:'), reason);
  process.exit(1);
});

// Start CLI
initializeCLI().catch((error) => {
  console.error(chalk.red('Failed to initialize CLI:'), error.message);
  process.exit(1);
});
