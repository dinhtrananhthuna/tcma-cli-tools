export interface Plugin {
  name: string;
  description: string;
  commands: string[];
  execute(command: string, args?: string[]): Promise<void>;
}

export abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract description: string;
  abstract commands: string[];

  abstract execute(command: string, args?: string[]): Promise<void>;

  protected log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const chalk = require('chalk');
    const timestamp = new Date().toLocaleTimeString();
    
    switch (type) {
      case 'info':
        console.log(chalk.blue(`[${timestamp}]`), chalk.white(message));
        break;
      case 'success':
        console.log(chalk.blue(`[${timestamp}]`), chalk.green(message));
        break;
      case 'warning':
        console.log(chalk.blue(`[${timestamp}]`), chalk.yellow(message));
        break;
      case 'error':
        console.log(chalk.blue(`[${timestamp}]`), chalk.red(message));
        break;
    }
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
