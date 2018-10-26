// import * as recursiveWalk from 'recursive-readdir';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
// import * as yaml from 'js-yaml';
import { writeErrorMessage } from './handler';
import { writeMessage } from './handler';
// var mkdirp = require('mkdirp');
// import * as mkdirp from mkdirp;

/**
 * Convert Postman collection to stREST requests
 * @param collection_file [optional] Target dir with .strest.yaml files in it
 */
export const convert = async (collection_file: string) => {
  let isFile = false
  let cwd_file
  // if a custom path was defined
  if(collection_file !== null){
    cwd_file = path.join(process.cwd(), collection_file);
    if(!fs.existsSync(cwd_file)){
      writeErrorMessage(`Path ${chalk.underline(path.join(process.cwd(), collection_file))} does not exist`);
      return 1
    }
    isFile = fs.statSync(cwd_file).isFile();
  } else {
    writeErrorMessage(`Postman collection not specified`);
    return 1
  }
  // if the path is a directory, walk through it and find all test files
  if(!isFile) {
    writeErrorMessage(`Specified collection ${chalk.underline(path.join(process.cwd(), collection_file))} is not a file.`);
    return 1
  }
  let collection
  try{
    collection = require(cwd_file);
  }catch(e){
    if (e instanceof ReferenceError) {
      writeErrorMessage(`ReferenceError.  Is it a json file?`);
      return 1;
    }else{
      throw e
    }
  }
  // Light validation on the collection
  if(collection.info.schema == "https://schema.getpostman.com/json/collection/v2.1.0/collection.json") {
    writeMessage(`Postman schema 2.1 confirmed`);
  } else{
    writeErrorMessage(`Postman schema not 2.1`);
    return 1
  }
  // await(exporter(collection.item))
  let result:any[] = []
  let cwd = path.join(process.cwd(),collection.info.name);
  result = await(buildDirs(collection.item, cwd, result))
  console.log(result)
  return 0
}


/**
 * Recurse Collection Items
 * @param item
 */
const buildDirs = async (items: Array<any>, working_dir: any, result: any[]) => {
  function IsJsonString(str:string) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
  }
  for (let i of items) {
    const new_working_dir = path.join(working_dir, i.name.replace(/[\ +\/+]/g,"_"));
    if(i.item || i._postman_isSubFolder) {
      result = await(buildDirs(i.item, new_working_dir, result))
    }else{
      let request_name = i.name.replace(/[\ +\/+]/g,"_") + ".strest.yml"
      let request: any = {}
      request.path = working_dir
      request.request = request_name
      request[request_name] = {}
      request[request_name].url = i.request.url.raw
      request[request_name].method = i.request.method
      if (i.request.header){
        for (let header of i.request.header){
   //       console.log(header)
        }
      }
      if (i.request.body){
        request[request_name].data = {}
        if(i.request.body.mode == "raw"){
          if(IsJsonString(i.request.body.raw)){
            request[request_name].data.json = JSON.parse(i.request.body.raw)
          }else{
            request[request_name].data.raw = i.request.body.raw
          }
        }
      }

      // convert scripts
      try {
        const script = i.event[0].script.exec.toString();
        
        const codeReg = /response\.to\.have\.status\(\d+\)/gm;
        const innerReg = /\((.*?)\)/

        const codeMatch = codeReg.exec(script);
        if(codeMatch !== null) {
          const innerVal = innerReg.exec(codeMatch[0]);
          const codeToProof = innerVal![1];
          if(typeof request[request_name].validate === 'undefined') {
            request[request_name].validate = {};
          }
          request[request_name].validate.code = codeToProof;
        }

      } catch(e) {
        // no scripts found
      }

      result.push(request)
    }
  }
  return result
}
