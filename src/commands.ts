import * as program from 'commander';
import * as handler from './handler';

// Initialize the commander.js CLI commands
const initializeCommands = () => {
  // main command
  program
    .usage('[targetFileOrDirectory]')
    .option('-p, --print', 'Print out all response data')
    .action(async (dir, cmd: any) => {
      if(typeof cmd === 'undefined') {
        cmd = dir;
        dir = null;
      }
      await handler.start(dir,cmd);
    })
  
  program.parse(process.argv);
}
export default initializeCommands;