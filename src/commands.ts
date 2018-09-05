import * as program from 'commander';
import * as handler from './handler';

// Initialize the commander.js CLI commands
const initializeCommands = () => {
  // main command
  program
    .option('-p, --print', 'Print out all response data')
    .option('-l, --log', 'Create a logfile including all response data')
    .action(async (cmd: any) => {
      await handler.start(cmd);
    })
  
  program.parse(process.argv);
}
export default initializeCommands;