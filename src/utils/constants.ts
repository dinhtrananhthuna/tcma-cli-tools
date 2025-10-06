export const CLI_CONFIG = {
  VERSION: '1.3.4',
  NAME: 'TCMA CLI Tools',
  DESCRIPTION: 'Development utilities for TCMA team - Code by Vu Dinh',
  REPOSITORY: 'https://github.com/dinhtrananhthuna/tcma-cli-tools.git',
  NPM_PACKAGE: 'tcma-cli-tools',
  NPM_URL: 'https://www.npmjs.com/package/tcma-cli-tools',
} as const;

export const COMMANDS = {
  UPDATE: 'npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git',
  UPDATE_NPM: 'npm update -g tcma-cli-tools',
} as const;

export const COLORS = {
  PRIMARY: 'cyan',
  SECONDARY: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'blue',
  TEXT: 'white',
  MUTED: 'gray',
  RETRO: {
    CYAN: 'cyan',
    MAGENTA: 'magenta',
    YELLOW: 'yellow',
    GREEN: 'green',
    BLUE: 'blue',
    RED: 'red',
    WHITE: 'white',
    GRAY: 'gray',
  },
} as const;

export const RETRO_SYMBOLS = {
  BORDER: {
    TOP_LEFT: '╔',
    TOP_RIGHT: '╗',
    BOTTOM_LEFT: '╚',
    BOTTOM_RIGHT: '╝',
    HORIZONTAL: '═',
    VERTICAL: '║',
    HORIZONTAL_THIN: '─',
    VERTICAL_THIN: '│',
  },
  ICONS: {
    SUCCESS: '[+]',
    ERROR: '[X]',
    WARNING: '[!]',
    INFO: '[*]',
    LOADING: '[*]',
    ROCKET: '[*]',
    GEAR: '[#]',
    FOLDER: '[D]',
    FILE: '[F]',
    ARROW: '->',
    STAR: '[*]',
    HEART: '<3',
  },
  PROGRESS: {
    FILLED: '█',
    EMPTY: '░',
    HALF: '▓',
  },
} as const;
