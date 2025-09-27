import chalk from 'chalk';
import figlet from 'figlet';

export class UIUtils {
  /**
   * Show ASCII art title
   */
  static showTitle(text: string, font: string = 'ANSI Shadow'): void {
    console.log(chalk.cyan(figlet.textSync(text, { 
      font: font,
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })));
  }

  /**
   * Show section header with borders
   */
  static showSectionHeader(title: string): void {
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan(`                              ${title.toUpperCase()}`));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
  }

  /**
   * Show info section
   */
  static showInfoSection(title: string, content: string[]): void {
    console.log(chalk.green(`${title.toUpperCase()}:`));
    content.forEach(line => {
      console.log(chalk.white(`   ${line}`));
    });
    console.log();
  }

  /**
   * Show command section
   */
  static showCommandSection(title: string, commands: string[]): void {
    console.log(chalk.blue(`${title.toUpperCase()}:`));
    commands.forEach(cmd => {
      console.log(chalk.white(`   ${cmd}`));
    });
    console.log();
  }

  /**
   * Show note/warning
   */
  static showNote(message: string): void {
    console.log(chalk.yellow(`NOTE: ${message}`));
    console.log();
  }

  /**
   * Show success message
   */
  static showSuccess(message: string): void {
    console.log(chalk.green(message.toUpperCase()));
  }

  /**
   * Show error message
   */
  static showError(message: string): void {
    console.log(chalk.red(message.toUpperCase()));
  }

  /**
   * Show loading message
   */
  static showLoading(message: string): void {
    console.log(chalk.blue(`${message.toUpperCase()}...`));
  }

  /**
   * Wait for user input with Escape key support
   */
  static async waitForEscape(): Promise<void> {
    return new Promise((resolve) => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        
        const handleKeyPress = (key: Buffer) => {
          // Check for Escape key (ASCII 27)
          if (key[0] === 27) {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', handleKeyPress);
            resolve();
          }
        };
        
        process.stdin.on('data', handleKeyPress);
      } else {
        // If not TTY, resolve immediately
        resolve();
      }
    });
  }

  /**
   * Show press Escape message
   */
  static showEscapeMessage(): void {
    console.log();
    console.log(chalk.cyan('Press ESC to return to main menu...'));
  }

  /**
   * Clear screen
   */
  static clearScreen(): void {
    console.clear();
  }

  /**
   * Show goodbye message
   */
  static showGoodbye(): void {
    console.log(chalk.green('Goodbye! Thanks for using TCMA CLI Tools.'));
  }
}
