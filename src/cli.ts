#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { PluginManager } from './core/plugin-manager';
import { UpdatePlugin } from './plugins/update-plugin';
import { DataComparisonPlugin } from './plugins/data-comparison-plugin';
import { UIUtils } from './utils/ui-utils';
import { CLI_CONFIG } from './utils/constants';

// Initialize CLI
async function initializeCLI() {
  showWelcome();
  
  // Initialize plugin manager
  const pluginManager = new PluginManager();
  
  // Register built-in plugins
  pluginManager.registerPlugin(new UpdatePlugin());
  pluginManager.registerPlugin(new DataComparisonPlugin());
  
  // Start interactive menu
  await showMainMenu(pluginManager);
}

// ASCII Art Welcome
function showWelcome() {
  UIUtils.clearScreen();
  UIUtils.showTitle('TCMA CLI');
  
  console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.green(`                    Welcome to ${CLI_CONFIG.NAME} v${CLI_CONFIG.VERSION}`));
  console.log(chalk.green(`                    ${CLI_CONFIG.DESCRIPTION}`));
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
    UIUtils.showGoodbye();
    process.exit(0);
  }

  // Execute selected plugin
  const plugin = pluginManager.getPlugin(selectedPlugin);
  if (plugin) {
    try {
      await plugin.execute('menu');
      
      // Plugin will handle its own footer with Escape key
      
      // Return to main menu
      await showMainMenu(pluginManager);
    } catch (error) {
      console.error(chalk.red('Error executing plugin:'), error);
      console.log(chalk.yellow('Press ESC to return to main menu...'));
      await UIUtils.waitForEscape();
      await showMainMenu(pluginManager);
    }
  }
}

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
