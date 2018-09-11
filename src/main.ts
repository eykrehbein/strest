#!/usr/bin/env node
import commands from './commands';
import { loadConfig } from './configLoader';

loadConfig();
commands();