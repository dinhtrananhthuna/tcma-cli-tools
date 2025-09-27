# TCMA CLI Tools

Development utilities for TCMA team.

## Installation

Install directly from Git repository:

```bash
npm install -g git+https://github.com/tcma-team/tcma-cli-tools.git
```

## Usage

```bash
# Show interactive menu
tcmatools

# Menu will show:
# 1. Update Tool
# 2. Exit
```

## Available Tools

- **Update Tool** - Check for updates and update TCMA CLI Tools

## Development

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
tcmatools
```

## Features

- ✅ **Interactive Menu** with numbered options
- ✅ **Retro ASCII Art** styling
- ✅ **Update Tool** for version management
- ✅ **Cross-platform Support**
- ✅ **TypeScript Support**
- ✅ **Git Direct Installation**

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

## License

MIT