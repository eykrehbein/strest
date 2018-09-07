import chalk from 'chalk';
import * as path from 'path';

import * as fsModule from './fs';
import * as yamlParser from './yaml-parse';
import * as test from './test';

/**
 * Main function. Fired when command was called
 * @param dir [optional] Target directory
 * @param cmd The command, including all flags
 */
export const start = async (dir:string , _: any) => {
  // use time for letting the user know how long the execution of the test took
  const executionStartedTime = new Date().getTime();

  console.log();
  // step 1: find all test files
  const testFiles = await fsModule.findTestFiles(dir);
  if(testFiles === null) {
    writeErrorMessage(`Path ${chalk.underline(path.join(process.cwd(), dir))} does not exist`);
    return;
  }
  const testFileAmount = testFiles.length;
  const colorizedTestFileAmount = colorizeMain(testFileAmount.toString());
  if(testFileAmount === 0) {
    writeMessage(chalk.gray('No testing files found'))
    return;
  }
  
  writeMessage(`Found ${colorizedTestFileAmount} test file(s)`)

  // step 2 :read the test files

  // Array of yaml-to-json parsed config data of how to perform the requests
  const testSettings = yamlParser.parseTestingFiles(testFiles)

  // proof/check that all necessary config arguments are passed 
  const validateSchema = yamlParser.validateSchema(testSettings);
  const amountOfValidSchemas = validateSchema.proofedSettings.length;

  // if the amount of valid test-files-schemas are less than the amount if test files, colorize the number red
  let colorizedAmountOfValidSchemas = colorizeMain(amountOfValidSchemas.toString());
  if(amountOfValidSchemas < testFileAmount) {
    colorizedAmountOfValidSchemas = colorizeCustomRed(amountOfValidSchemas.toString());
  }
  writeMessage(`Schema validation: ${colorizedAmountOfValidSchemas} of ${colorizedTestFileAmount} file(s) passed`)

  const validTests = validateSchema.proofedSettings;
  if(validTests.length === 0) {
    console.log();
    return;
  }
  console.log();
  await test.performTests(validTests);
  console.log();

  const executionEndedTime = new Date().getTime();
  const executionTime = executionEndedTime - executionStartedTime;
  writeMessage(`✨  Done in ${chalk.bold((executionTime/1000).toString() + 's')}`, false);
  console.log();
}

/**
 * Print out a formatted message
 * @param message 
 */
export const writeMessage = (message: string, isBold?: boolean) => {
  if(isBold === false) {
    console.log(`[ ${colorizeMain(chalk.bold('Strest'))} ] ${message}`);
    return;
  }
  console.log(`[ ${colorizeMain(chalk.bold('Strest'))} ] ${chalk.bold(message)}`);
}
/**
 * Print out a formatted message in red
 * @param message 
 */
export const writeErrorMessage = (message: string) => {
  writeMessage(colorizeCustomRed(message));
}

/**
 * Give the given string a color of #2ed573
 * @param message 
 */
export const colorizeMain = (message: string) => {
  return chalk.hex('#2ed573')(message);
}
/**
 * Give the given string a color of #ff4757
 * @param message 
 */
export const colorizeCustomRed = (message: string) => {
  return chalk.hex('#ff4757')(message);
}