import * as fsModule from './fs';
import chalk from 'chalk';
import * as path from 'path';
/**
 * Main function. Fired when command was called
 * @param dir [optional] Target directory
 * @param cmd The command, including all flags
 */
export const start = async (dir:string , _: any) => {
  // find all test files
  const testFiles = await fsModule.findTestFiles(dir);
  if(testFiles === null) {
    writeErrorMessage(`Path ${chalk.underline(path.join(process.cwd(), dir))} does not exist`);
    return;
  }
  if(testFiles.length === 0) {
    writeMessage(chalk.gray('No testing files found'))
    return;
  }
  console.log(testFiles.length);
  // read the test files
}

/**
 * Print out a formatted message
 * @param message 
 */
export const writeMessage = (message: string) => {
  console.log(`[ ${chalk.hex('#2ed573').bold('Strest')} ] ${message}`);
}
/**
 * Print out a formatted message in red
 * @param message 
 */
export const writeErrorMessage = (message: string) => {
  writeMessage(chalk.red(message));
}