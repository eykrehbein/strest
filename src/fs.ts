import * as recursiveWalk from 'recursive-readdir';
import * as path from 'path';
import * as fs from 'fs';


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
    let matchList: Array<String> = [];

    // find all files that end with .strest.yaml
    files.map((path) => {
      const rg = new RegExp('.*\.strest\.yaml$');
      if(rg.test(path) === true) {
        matchList.push(path);
      }  
    })
    return matchList;
  }
  // return just the file that was specified
  return [cwd];
}