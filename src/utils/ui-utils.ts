import chalk from 'chalk';
import figlet from 'figlet';

export class UIUtils {
  /**
   * Show retro ASCII art title with enhanced styling
   */
  static showTitle(text: string, font: string = 'ANSI Shadow'): void {
    const asciiArt = figlet.textSync(text, {
      font: font,
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });

    // Apply retro gradient effect
    const lines = asciiArt.split('\n');
    const coloredLines = lines.map((line, index) => {
      const colors = [chalk.cyan, chalk.magenta, chalk.yellow, chalk.green, chalk.blue];
      const colorIndex = index % colors.length;
      return colors[colorIndex](line);
    });

    console.log(coloredLines.join('\n'));
  }

  /**
   * Show retro section header with enhanced borders
   */
  static showSectionHeader(title: string): void {
    const border = '═'.repeat(80);
    const topBorder = chalk.magenta('╔' + border + '╗');
    const bottomBorder = chalk.magenta('╚' + border + '╝');
    const titleLine =
      chalk.magenta('║') + ' '.repeat(25) + chalk.cyan.bold(` ${title.toUpperCase()} `);

    console.log(topBorder);
    console.log(titleLine);
    console.log(bottomBorder);
    console.log();
  }

  /**
   * Show retro info section with enhanced styling
   */
  static showInfoSection(title: string, content: string[]): void {
    console.log(chalk.green.bold(`┌─ ${title.toUpperCase()} ─┐`));
    content.forEach(line => {
      console.log(chalk.white(`│ ${line.padEnd(76)} │`));
    });
    console.log(chalk.green.bold('└' + '─'.repeat(78) + '┘'));
    console.log();
  }

  /**
   * Show retro command section with enhanced styling
   */
  static showCommandSection(title: string, commands: string[]): void {
    console.log(chalk.blue.bold(`┌─ ${title.toUpperCase()} ─┐`));
    commands.forEach(cmd => {
      console.log(chalk.white(`│ ${cmd.padEnd(76)} │`));
    });
    console.log(chalk.blue.bold('└' + '─'.repeat(78) + '┘'));
    console.log();
  }

  /**
   * Show retro note/warning with enhanced styling
   */
  static showNote(message: string): void {
    console.log(chalk.yellow.bold(`[!] NOTE: ${message}`));
    console.log();
  }

  /**
   * Show retro success message with enhanced styling
   */
  static showSuccess(message: string): void {
    console.log(chalk.green.bold(`[+] ${message.toUpperCase()}`));
  }

  /**
   * Show retro error message with enhanced styling
   */
  static showError(message: string): void {
    console.log(chalk.red.bold(`[X] ${message.toUpperCase()}`));
  }

  /**
   * Show retro loading message with enhanced styling
   */
  static showLoading(message: string): void {
    console.log(chalk.blue.bold(`[*] ${message.toUpperCase()}...`));
  }

  /**
   * Wait for user input with Escape key support
   */
  static async waitForEscape(): Promise<void> {
    return new Promise(resolve => {
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
   * Show retro press Escape message with enhanced styling
   */
  static showEscapeMessage(): void {
    console.log();
    console.log(chalk.cyan.bold('┌─ NAVIGATION ─┐'));
    console.log(chalk.cyan.bold('│ Press ESC to return to main menu... │'));
    console.log(chalk.cyan.bold('└' + '─'.repeat(37) + '┘'));
  }

  /**
   * Clear screen
   */
  static clearScreen(): void {
    console.clear();
  }

  /**
   * Show retro goodbye message with enhanced styling
   */
  static showGoodbye(): void {
    console.log();
    console.log(chalk.green.bold('┌─ FAREWELL ─┐'));
    console.log(chalk.green.bold('│ Goodbye! Thanks for using TCMA CLI Tools. │'));
    console.log(chalk.green.bold('└' + '─'.repeat(43) + '┘'));
    console.log();
  }

  /**
   * Show retro progress bar
   */
  static showProgressBar(current: number, total: number, label: string = 'Progress'): void {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    console.log(chalk.cyan.bold(`┌─ ${label} ─┐`));
    console.log(chalk.cyan.bold(`│ [${bar}] ${percentage}% (${current}/${total}) │`));
    console.log(chalk.cyan.bold('└' + '─'.repeat(28) + '┘'));
  }

  /**
   * Show retro ASCII art logo
   */
  static showLogo(): void {
    const logo = `
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                                                                              ║
    ║    ████████╗ ██████╗███╗   ███╗ █████╗     ██████╗██╗     ██╗                ║
    ║    ╚══██╔══╝██╔════╝████╗ ████║██╔══██╗   ██╔════╝██║     ██║                ║
    ║       ██║   ██║     ██╔████╔██║███████║   ██║     ██║     ██║                ║
    ║       ██║   ██║     ██║╚██╔╝██║██╔══██║   ██║     ██║     ██║                ║
    ║       ██║   ╚██████╗██║ ╚═╝ ██║██║  ██║   ╚██████╗███████╗██║                ║
    ║       ╚═╝    ╚═════╝╚═╝     ╚═╝╚═╝  ╚═╝    ╚═════╝╚══════╝╚═╝                ║
    ║                                                                              ║
    ║              [*] CLI TOOLS - DEVELOPMENT UTILITIES [*]                       ║
    ║                                                                              ║
    ╚══════════════════════════════════════════════════════════════════════════════╝
    `;

    console.log(chalk.cyan(logo));
  }

  /**
   * Show retro menu item with enhanced styling
   */
  static showMenuItem(index: number, title: string, description?: string): void {
    const item = chalk.cyan.bold(`${index}.`) + chalk.white.bold(` ${title}`);
    if (description) {
      console.log(item + chalk.gray(` - ${description}`));
    } else {
      console.log(item);
    }
  }

  /**
   * Show retro separator line
   */
  static showSeparator(char: string = '─', length: number = 80): void {
    console.log(chalk.magenta(char.repeat(length)));
  }

  /**
   * Show retro loading animation
   */
  static async showLoadingAnimation(message: string, duration: number = 3000): Promise<void> {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const colors = [chalk.cyan, chalk.magenta, chalk.yellow, chalk.green, chalk.blue];

    let frameIndex = 0;
    let colorIndex = 0;

    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const frame = frames[frameIndex];
      const color = colors[colorIndex];

      process.stdout.write(`\r${color(`${frame} ${message}...`)} ${Math.round(progress * 100)}%`);

      frameIndex = (frameIndex + 1) % frames.length;
      if (frameIndex === 0) {
        colorIndex = (colorIndex + 1) % colors.length;
      }

      if (progress >= 1) {
        clearInterval(interval);
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        console.log(chalk.green.bold(`[+] ${message} completed!`));
      }
    }, 100);

    return new Promise(resolve => {
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, duration);
    });
  }

  /**
   * Show retro typewriter effect
   */
  static async typewriter(text: string, delay: number = 50): Promise<void> {
    for (let i = 0; i < text.length; i++) {
      process.stdout.write(chalk.cyan(text[i]));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.log();
  }

  /**
   * Show retro fade in effect
   */
  static async fadeIn(text: string, steps: number = 10): Promise<void> {
    const colors = [
      chalk.gray,
      chalk.gray.bold,
      chalk.white,
      chalk.white.bold,
      chalk.cyan,
      chalk.cyan.bold,
    ];

    for (let i = 0; i < steps; i++) {
      const colorIndex = Math.floor((i / steps) * colors.length);
      const color = colors[colorIndex];

      process.stdout.write(`\r${color(text)}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log();
  }

  /**
   * Show retro matrix rain effect
   */
  static async matrixRain(duration: number = 2000): Promise<void> {
    const chars = '01';
    const columns = process.stdout.columns || 80;
    const rows = 20;

    const startTime = Date.now();

    const interval = setInterval(() => {
      console.clear();

      for (let row = 0; row < rows; row++) {
        let line = '';
        for (let col = 0; col < columns; col++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const color = Math.random() > 0.5 ? chalk.green : chalk.green.bold;
          line += color(char);
        }
        console.log(line);
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        clearInterval(interval);
        console.clear();
      }
    }, 100);

    return new Promise(resolve => {
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, duration);
    });
  }

  /**
   * Show retro glitch effect
   */
  static async glitchEffect(text: string, iterations: number = 5): Promise<void> {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    for (let i = 0; i < iterations; i++) {
      // Show glitched version
      let glitched = '';
      for (let j = 0; j < text.length; j++) {
        if (Math.random() > 0.7) {
          glitched += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        } else {
          glitched += text[j];
        }
      }

      process.stdout.write(`\r${chalk.red(glitched)}`);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Show original
      process.stdout.write(`\r${chalk.cyan(text)}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log();
  }
}
