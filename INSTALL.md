# TCMA CLI Tools - Installation Guide

## Quick Installation

```bash
# Install directly from Git repository
npm install -g git+https://github.com/tcma-team/tcma-cli-tools.git

# Verify installation
tcmatools --version
```

## Usage

```bash
# Show main menu
tcmatools

# Execute commands
tcmatools /help
tcmatools /version
tcmatools /plugins

# Use aliases
tcmatools /h
tcmatools /v
tcmatools /p
```

## Development Setup

```bash
# Clone repository
git clone https://github.com/tcma-team/tcma-cli-tools.git
cd tcma-cli-tools

# Install dependencies
npm install

# Build project
npm run build

# Run in development mode
npm run dev

# Test installation
npm link
tcmatools --version
```

## Available Commands

- `/help`, `/h`, `/?` - Show help information
- `/version`, `/v` - Show version information  
- `/plugins`, `/p` - List all available plugins

## Plugin System

TCMA CLI Tools uses a modular plugin architecture. Each plugin can register multiple commands and provide specific functionality.

### Creating a New Plugin

1. Create a new plugin class extending `BasePlugin`
2. Implement the required methods
3. Register the plugin in the `PluginManager`

Example:

```typescript
import { BasePlugin } from './core/base-plugin';

export class MyPlugin extends BasePlugin {
  name = 'My Plugin';
  description = 'My custom plugin';
  commands = ['mycommand', 'mc'];

  async execute(command: string, args?: string[]): Promise<void> {
    console.log('My plugin executed!');
  }
}
```

## Features

- ✅ **ASCII Art Welcome Screen**
- ✅ **Plugin-based Architecture**
- ✅ **Slash Commands** (`/help`, `/version`, `/plugins`)
- ✅ **Command Aliases** (`/h`, `/v`, `/p`)
- ✅ **Cross-platform Support**
- ✅ **TypeScript Support**
- ✅ **Git Direct Installation**

## License

MIT
