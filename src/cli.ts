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
  await showWelcome();
  
  // Initialize plugin manager
  const pluginManager = new PluginManager();
  
  // Register built-in plugins
  pluginManager.registerPlugin(new UpdatePlugin());
  pluginManager.registerPlugin(new DataComparisonPlugin());
  
  // Start interactive menu
  await showMainMenu(pluginManager);
}

// Retro ASCII Art Welcome
async function showWelcome() {
  UIUtils.clearScreen();
  UIUtils.showLogo();
  
  console.log();
  UIUtils.showSectionHeader('WELCOME');
  
  console.log(chalk.cyan.bold(`┌─ SYSTEM INFO ─┐`));
  console.log(chalk.cyan.bold(`│ ${CLI_CONFIG.NAME} v${CLI_CONFIG.VERSION}`));
  console.log(chalk.cyan.bold(`│ ${CLI_CONFIG.DESCRIPTION}`));
  console.log(chalk.cyan.bold(`└${'─'.repeat(60)}┘`));
  console.log();
  
  UIUtils.showSeparator('═', 80);
  console.log();
  await UIUtils.typewriter('Welcome to TCMA CLI Tools');
}

// Show retro interactive main menu
async function showMainMenu(pluginManager: PluginManager) {
  const plugins = pluginManager.getAllPlugins();
  
  // Show menu header
  UIUtils.showSectionHeader('MAIN MENU');
  
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
      message: chalk.cyan.bold('[*] Select a tool to run:'),
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
      await UIUtils.showLoadingAnimation('Opening selected tool', 800);
      await plugin.execute('menu');
      
      // Plugin will handle its own footer with Escape key
      
      // Return to main menu
      await showMainMenu(pluginManager);
    } catch (error) {
      console.error(chalk.red.bold('[X] Error executing plugin:'), error);
      UIUtils.showEscapeMessage();
      await UIUtils.waitForEscape();
      await showMainMenu(pluginManager);
    }
  }
}

// Handle Ctrl+C gracefully with retro styling
process.on('SIGINT', () => {
  console.log();
  UIUtils.showGoodbye();
  process.exit(0);
});

// Start CLI with retro initialization
initializeCLI().catch((error) => {
  console.error(chalk.red.bold('[X] Failed to initialize CLI:'), error.message);
  process.exit(1);
});
