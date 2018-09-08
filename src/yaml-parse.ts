import * as Joi from 'joi';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

import { writeErrorMessage } from './handler';
import { Schema as joiSchema } from './configSchema';

/**
 * Read and parse the test files to JSON
 * @param pathArray Array of the test-config files
 */
export const parseTestingFiles = (pathArray: string[]) => {
  let responseData: object[] = [];
  pathArray.map((filePath: any) => {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed: object = yaml.safeLoad(data)
      responseData.push(parsed);
    } catch(e) {
      writeErrorMessage(`An error occured while parsing ${path.relative(process.cwd(), filePath)}`)
      writeErrorMessage(e);
    }
  })
  return responseData;
}

export const validateSchema = (testSettings: object[]) => {
  let proofedSettings: object[] = [];
  let errors: string[] = [];
  testSettings.map((fileSetting) => {
    const test = Joi.validate(fileSetting, joiSchema);
    if(test.error === null) {
      proofedSettings.push(fileSetting);
    } else {
      errors.push(test.error.message);
    }
  });
  return { proofedSettings, errors};
}