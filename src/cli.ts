#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { PluginManager } from './core/plugin-manager';
import { UpdatePlugin } from './plugins/update-plugin';

// Initialize CLI
async function initializeCLI() {
  showWelcome();
  
  // Initialize plugin manager
  const pluginManager = new PluginManager();
  
  // Register built-in plugins
  pluginManager.registerPlugin(new UpdatePlugin());
  
  // Start interactive menu
  await showMainMenu(pluginManager);
}

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
  console.log(chalk.green('                    Development utilities for TCMA team - Code by Vu Dinh        '));
  console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();
}

// Show interactive main menu
async function showMainMenu(pluginManager: PluginManager) {
  const plugins = pluginManager.getAllPlugins();
  
  const choices = plugins.map((plugin, index) => ({
    name: `${index + 1}. ${plugin.name}`,
    value: plugin.name,
    short: plugin.name
  }));
  
  // Add exit option
  choices.push({
    name: `${choices.length + 1}. Exit`,
    value: 'exit',
    short: 'Exit'
  });

  const { selectedPlugin } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedPlugin',
      message: chalk.blue('Select a tool to run:'),
      choices: choices,
      pageSize: 10
    }
  ]);

  if (selectedPlugin === 'exit') {
    console.log(chalk.green('Goodbye! Thanks for using TCMA CLI Tools.'));
    process.exit(0);
  }

  // Execute selected plugin
  const plugin = pluginManager.getPlugin(selectedPlugin);
  if (plugin) {
    try {
      await plugin.execute('menu');
      
      // Wait for user to press any key to return to menu
      console.log();
      console.log(chalk.cyan('Press any key to return to main menu...'));
      await waitForUserInput();
      
      // Return to main menu
      await showMainMenu(pluginManager);
    } catch (error) {
      console.error(chalk.red('Error executing plugin:'), error);
      console.log(chalk.yellow('Press any key to return to main menu...'));
      await waitForUserInput();
      await showMainMenu(pluginManager);
    }
  }
}

// Wait for user input
function waitForUserInput(): Promise<void> {
  return new Promise((resolve) => {
    // Check if stdin is a TTY (interactive terminal)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    } else {
      // If not TTY (like in pipe), just resolve immediately
      resolve();
    }
  });
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

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nGoodbye! Thanks for using TCMA CLI Tools.'));
  process.exit(0);
});

// Start CLI
initializeCLI().catch((error) => {
  console.error(chalk.red('Failed to initialize CLI:'), error.message);
  process.exit(1);
});
