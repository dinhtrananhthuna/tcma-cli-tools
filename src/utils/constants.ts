export const CLI_CONFIG = {
  VERSION: '1.0.0',
  NAME: 'TCMA CLI Tools',
  DESCRIPTION: 'Development utilities for TCMA team - Code by Vu Dinh',
  REPOSITORY: 'https://github.com/dinhtrananhthuna/tcma-cli-tools.git',
  NPM_PACKAGE: 'tcma-cli-tools',
  NPM_URL: 'https://www.npmjs.com/package/tcma-cli-tools'
} as const;

export const COMMANDS = {
  UPDATE: 'npm install -g git+https://github.com/dinhtrananhthuna/tcma-cli-tools.git',
  UPDATE_NPM: 'npm update -g tcma-cli-tools'
} as const;

export const COLORS = {
  PRIMARY: 'cyan',
  SECONDARY: 'green', 
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'blue',
  TEXT: 'white',
  MUTED: 'gray'
} as const;
