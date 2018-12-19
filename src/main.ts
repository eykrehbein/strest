#!/usr/bin/env node
import { initializeCommands } from './commands';
import { loadConfig } from './configLoader';

// Allow Docker container process to exit
process.on('SIGINT', () => {
    process.exit(0);
})

loadConfig();
initializeCommands();