import * as recursiveWalk from 'recursive-readdir';
import * as path from 'path';
import * as fs from 'fs';
import * as Joi from 'joi';
import * as yaml from 'js-yaml';
import { writeErrorMessage } from './handler';
import { BulkSchema as bulkSchema } from './configSchema';
var sortPaths = require('sort-paths');


/**
 * Find all .strest.yaml files
 * @param dir [optional] Target dir with .strest.yaml files in it
 */
export const findTestFiles = async (dir: string) => {
  let cwd = process.cwd();
  let isFile = false;
  // if a custom path was defined
  if(dir !== null){
    cwd = path.join(process.cwd(), dir);
    if(!fs.existsSync(cwd)){
      return null;
    }
    isFile = fs.statSync(cwd).isFile();
  }
  // if the path is a directory, walk through it and find all test files
  if(!isFile) {
    // get all files paths (except those in .git and node_modules folder)
    const files = await recursiveWalk(cwd, ['node_modules', '.git']);

    // all matching file paths will be stored here
    let matchList: string[] = [];

    // find all files that end with .strest.yaml
    files.map((path) => {
      const rg1 = new RegExp('.*\.strest\.yaml$');
      const rg2 = new RegExp('.*\.strest\.yml$');
      if(rg1.test(path) === true || rg2.test(path)) {
        matchList.push(path);
      }  
    })
    return sortPaths(matchList, "/");
  }
  // return just the file that was specified
  return [cwd];
}

/**
 * Recurse all .strest.yaml files based on bulk definition
 * @param bulk file containing all executions
 */
export const getBulk = async (bulk: string) => {
  let cwd = process.cwd();
  let allTests: string[] = [];
  // if a custom path was defined
  cwd = path.join(process.cwd(), bulk);
  if(!fs.existsSync(cwd)){
    return [];
  }
  const data = fs.readFileSync(bulk, 'utf8');
  const files: any = yaml.safeLoad(data)
  const test = Joi.validate(files, bulkSchema);
  if(test.error === null) {
    for (const file of files) {
      const newTests = await findTestFiles(file)
      if(newTests == null){
        writeErrorMessage(`Path from bulk tests ${file} does not exist`)
        allTests = []
      }else{
        allTests = allTests.concat(newTests)
      }
    }
  } else {
    writeErrorMessage(`Validation failed of bulk file ${bulk}`)
  }
  return allTests
}