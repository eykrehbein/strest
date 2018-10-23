#!/usr/bin/env node
import commands from './commands';
import { loadConfig } from './configLoader';

// Allow Docker container process to exit
process.on('SIGINT', () => {
    process.exit(0);
})

loadConfig();
commands();