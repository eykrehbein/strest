import chalk from 'chalk';
import * as ora from 'ora';
import axios from 'axios';
import * as qs from 'qs';
import { colorizeMain, colorizeCustomRed } from './handler';
import { requestObjectSchema as requestObjectSchema } from './configSchema';



/**
 * All Data that any request returns, will be stored here. After that it can be used in the following methods
 */
let requestReponses: any = {
  // // Example data
  // register: {
  //     id: 123,
  //     token: 'aTokenValue'
  // },
  // rawDataExample: 'asdaasds'
}

/**
 * Main handler that will perform the tests with each valid test object
 * @param testObjects 
 */
export const performTests = async (testObjects: object[]) => {
  let testObject: any
  let abortBecauseTestFailed = false;
  
  for(testObject of testObjects){ 
    
    if(!abortBecauseTestFailed){
    
      const requests = testObject['requests'];
      for(let requestName in requests) {
    
        if(!abortBecauseTestFailed) {
          
          const val = requests[requestName];
  
          const spinner = ora(`Testing ${chalk.bold(colorizeMain(requestName))}`).start();
          let error = await performRequest(val, requestName);
          
          if(error.isError === true) {
            spinner.fail(colorizeCustomRed(`Testing ${chalk.bold(colorizeCustomRed(requestName))} failed \n\n${error.message}`))
            // if one test failed, don't run others
            abortBecauseTestFailed = true;
          } else {
            spinner.succeed(`Testing ${chalk.bold(colorizeMain(requestName))} succeeded`)
          }
    
        }
    
      }
    }
  }
} 
/**
 * Take every curly braces and replace the value with the matching response data
 * @param obj Some Object to be tested  
 */
const computeRequestObject = (obj: Object) => {
  // Find everything that matches Value(someValueString)
  const reg = /Value\((.*?)\)/
  const innerReg = /\((.*?)\)/

  let item: any;
  for(item in obj) {
    let val = (<any>obj)[item];
    if(typeof val === 'object') {
      // be recursive
      const step: any = computeRequestObject(val)
      if(step !== null) {
        return step;
      }
    } else {
      // find all Value(...) strings in any item
      if(reg.test(val) === true) {
        // get the value out of the string
        let fullValue = reg.exec(val)!;
   

         // DOTNOTATION TO OBJECT REFERENCE
          // get the dot notation string
          let dotNotationFullMatch = innerReg.exec(fullValue[0])!;
          const dotNotation = dotNotationFullMatch[1]!;

          try {
            const index = (obj: any ,i:any) => obj[i]
            let reducedValue = dotNotation.split('.').reduce(index, requestReponses)

            if(typeof reducedValue !== 'undefined') {
              // replace the string with the new value
              (<any>obj)[item] = val.replace(reg, reducedValue)
            } else {
              return `There is no corresponding response value to ${chalk.bold(dotNotation)}`;
            }
            
          } catch(e) {
            return e;
          }
      }
    }
  }
  return null;
}

/**
 * Perform the Request
 * @param requestObject 
 * @param requestName 
 */

const performRequest = async (requestObject: requestObjectSchema, requestName: string) => {

  const error = computeRequestObject(requestObject);

  if(error !== null) {
    return {isError: true, message: error}
  }

  // parse the requestObject
  // let requestMethod: string, requestData: any, requestUrl: string, requestHeaders: any, requestParams: string;
  interface AxiosObject {
    url?: any,
    method?: any,
    data?: any,
    params?: any,
    headers?: any
  }

  let axiosObject: AxiosObject = {};
  // optional keys 
  
  axiosObject.url = requestObject.url;
  axiosObject.method = requestObject.method;

  // headers 
  if(typeof requestObject.headers !== 'undefined') {
    axiosObject.headers = requestObject.headers;
  }

  // data
  if(typeof requestObject.data !== 'undefined') {
    // json data
    if(typeof requestObject.data.json !== 'undefined') {
      axiosObject.data = requestObject.data.json;
    }
    // raw data
    if(typeof requestObject.data.raw !== 'undefined') {
      axiosObject.data  = requestObject.data.raw;
    }
    // params
    if(typeof requestObject.data.params !== 'undefined') {
      if(typeof requestObject.data.params === 'string') {
        axiosObject.params = requestObject.data.params;
      }
      // stringify params
      if(typeof requestObject.data.params === 'object') {
        axiosObject.params = qs.stringify(requestObject.data.params)
      }
    }

  }

  try {
    const response = await axios(axiosObject)
    
    if(typeof response.data !== 'undefined') {
      requestReponses[requestName] = response.data;
    } 
    

  } catch(e) {
    return { isError: true, message: e}
  }
  
  return { isError: false, message: ''}

}