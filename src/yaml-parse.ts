import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { writeErrorMessage } from './handler';
/**
 * Read and parse the test files to JSON
 * @param pathArray Array of the test-config files
 */
export const parseTestingFiles = (pathArray: String[]) => {
  let responseData: any[] = [];
  pathArray.map((filePath: any) => {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = yaml.safeLoad(data)
      responseData.push(parsed);
    } catch(e) {
      writeErrorMessage(`An error occured while parsing ${path.relative(process.cwd(), filePath)}`)
      writeErrorMessage(e);
    }
  })
  return responseData;
}