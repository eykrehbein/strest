import * as Joi from 'joi';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

import { writeErrorMessage } from './handler';
import { Schema as joiSchema } from './configSchema';

/**
 * Read and parse the test files to JSON
 * @param pathArray Array of the test-config files
 * @param dir Directory for execution
 */
export const parseTestingFiles = (pathArray: string[], dir: string) => {
  let responseData: object[] = [];
  pathArray.map((filePath: any) => {
    try {
      if(typeof filePath === 'string'){
        const data = fs.readFileSync(filePath.toString(), 'utf8');
        const parsed: any = yaml.safeLoad(data)
        const removeFilename = filePath.substring(0, filePath.lastIndexOf("/") + 1);
        if(dir === null){
          dir = "";
        }
        parsed.raw = data
        parsed.relativePath = removeFilename.replace(path.join(process.cwd(), dir), "./")
        responseData.push(parsed);
      }
    } catch(e) {
      writeErrorMessage(`An error occured while parsing ${path.relative(process.cwd(), filePath)}`)
      writeErrorMessage(e);
    }
  })
  return responseData;
}

export const validateSchema = (testSettings: object[]) => {
  let proofedSettings: object[] = [];
  let errors: Joi.ValidationError[] = [];
  testSettings.map((fileSetting) => {
    const test = Joi.validate(fileSetting, joiSchema);
    if(test.error === null) {
      proofedSettings.push(fileSetting);
    } else {
      errors.push(test.error);
    }
  });
  return { proofedSettings, errors};
}