import chalk from 'chalk';
import * as Joi from 'joi';
import * as ora from 'ora';
import axios, { AxiosResponse } from 'axios';
import * as qs from 'qs';
import * as faker from 'faker';
import { colorizeMain, colorizeCustomRed } from './handler';
import { requestObjectSchema as requestObjectSchema } from './configSchema';
import { config } from './configLoader';
import * as jp from 'jsonpath';

require('request-to-curl');

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

// The manually defined variables 
// Usable throught Variable(variableName) or Var(variableName)
let definedVariables: any = {

}

/**
 * Main handler that will perform the tests with each valid test object
 * @param testObjects 
 * @param printAll If true, all response information will be logged in the console
 */
export const performTests = async (testObjects: object[], cmd: any) => {
  let testObject: any
  let abortBecauseTestFailed = false;
  
  const printAll = cmd.print;

  // true if the --output curl option was set
  const toCurl = cmd.output == 'curl';
  let curPath = "./";
  if(testObjects.length > 1){
    console.log(chalk.blueBright("Executing tests in " + curPath));
  }
  for(testObject of testObjects){
  
    if(testObject['allowInsecure']) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    if(testObject['variables']) {
      // merge the existing variables with the new to allow multiple testfiles
      // to use variables from previous files
      definedVariables = {
        ...definedVariables,
        ...testObject['variables']
      }
    }
  
    if (curPath != testObject.relativePath && testObjects.length > 1){
      console.log(chalk.blueBright("Executing tests in: " + testObject.relativePath));
    }
    curPath = testObject.relativePath
    if(!abortBecauseTestFailed){
    
      const requests = testObject['requests'];
      for(let requestName in requests) {
    
        if(!abortBecauseTestFailed) {
          const val = requests[requestName];

          let runTimes = 1;
          if(typeof val.validate !== 'undefined'){
            if(typeof val.validate.max_retries !== 'undefined'){
              runTimes = val.validate.max_retries;
            }
          }
          for(let i = 0; i != runTimes; i++) {
            // Delay for the specified number of milliseconds if given
            if(typeof val.delay !== 'undefined') {
              const waitSpinner = ora(`Waiting for ${chalk.bold(colorizeMain(val.delay))} milliseconds`).start();

              await function() {
                return new Promise(resolve => setTimeout(resolve, val.delay));
              }();

              waitSpinner.stop();
            }

            const spinner = ora(`Testing ${chalk.bold(colorizeMain(requestName))}`).start();
            const startTime = new Date().getTime();
            let result = "succeeded"

            let error = computeRequestObject(val, requestReponses);

            if(error !== null) {
              // pass
            } else {
              if(typeof val.if !== 'undefined'){
                if(val.if.operand == val.if.equals){
                  error = await performRequest(val, requestName, printAll);
                } else {
                  result = "skipped"
                  error = { isError: false, message: null, code: 0 }
                }
              } else {
                error = await performRequest(val, requestName, printAll);
              }
            }

            const endTime = new Date().getTime();
            const execTime = (endTime - startTime) / 1000;

            if(error.isError === true) {
              if(runTimes === 1){
                spinner.clear();
                spinner.fail(colorizeCustomRed(`Testing ${chalk.bold(colorizeCustomRed(requestName))} failed (${chalk.bold(`${execTime.toString()}s`)}) \n${error.message}\n`))
              } else {
                if(runTimes - 1 === i){
                  spinner.fail(colorizeCustomRed(`Testing ${chalk.bold(colorizeCustomRed(requestName))} failed to validate within ${chalk.bold(colorizeCustomRed(runTimes.toString()))} (${chalk.bold(`${execTime.toString()}s`)}) \n${error.message}\n`))
                  abortBecauseTestFailed = true;
                  return error.code;
                } else {
                  spinner.fail(colorizeCustomRed(`Testing ${chalk.bold(colorizeCustomRed(requestName))} failed to validate. Retrying (${chalk.bold((runTimes -i).toString())})... (${chalk.bold(`${execTime.toString()}s`)}) \n${error.message}\n`))
                  continue
                }
              }
            } else {
              if(error.message !== null) {
                // log the response info and data
                const res: AxiosResponse<any> = error.message;
                let parsedData = res.data;
                if(typeof res.data === 'object') {
                  parsedData = JSON.stringify(res.data, null, 2);
                }

                let dataString = '';
                if(parsedData != '') {
                  dataString = `\n\n${colorizeMain('Data')}: \n\n${chalk.hex(config.secondaryColor)(parsedData)}\n`;
                } else {
                  dataString = `\n\n${colorizeMain('Data')}: No data received\n`;
                }

                spinner.succeed(
                  `Testing ${chalk.bold(colorizeMain(requestName))} ${result} (${chalk.bold(`${execTime.toString()}s`)})` +
                  `\n\n${colorizeMain('Status')}: ${res.status}`+
                  `\n${colorizeMain('Status Text')}: ${res.statusText}` +
                  `\n\n${colorizeMain('Headers')}: \n\n${chalk.hex(config.secondaryColor)(JSON.stringify(res.headers, null ,2))}` +
                  `${dataString}`
                )
              } else {
                spinner.succeed(`Testing ${chalk.bold(colorizeMain(requestName))} ${result} (${chalk.bold(`${execTime.toString()}s`)})`)
              }
            }
            if(toCurl === true){
              console.log(`\n${colorizeMain('Curl Equivalent: ')}${chalk.grey(error.curl)}\n`);
            }
            break
          }
        }
      }
    }
  }
  return 0;
} 

/**
 * Take every curly braces and replace the value with the matching response data
 * @param obj Some Object to be tested  
 */
export const computeRequestObject = (obj: Object, r: any) => {
  // Find everything that matches Value(someValueString)
  const regValue = /Value\((.*?)\)/g
  const regFake = /Fake\((.*?)\)/g
  const regEnv = /Env\((.*?)\)/g
  const regLongVar = /Variable\((.*?)\)/g
  const regShortVar = /Var\((.*?)\)/g
  const innerReg = /\((.*?)\)/
  
  let item: any;
  for(item in obj) {
    let val = (<any>obj)[item];
    if(typeof val === 'object') {
      // be recursive
      const step: any = computeRequestObject(val, r)
      if(step !== null) {
        return step;
      }
    } else {
      // find all Value(...) strings in any item
      if(regValue.test(val) === true) {

        let outterMatchValue = val.match(regValue);
        let returnVal = null;
        outterMatchValue.forEach((m: string) => {
          const innerMatchValue = m.match(innerReg);
          if(innerMatchValue !== null) {
            try {
              const index = (obj:any, i:any) => {
                const arrIndexReg = /\[(.*?)\]/gm;
                const arrNameReg = /^[^\[]*/gm;
                let m;
                const arrIndices = [];

                do {
                  m = arrIndexReg.exec(i);
                  if (m !== null) {
                    arrIndices.push(parseInt(m[1]));
                  }
                } while(m !== null);

                if (arrIndices.length) {
                  const name = i.match(arrNameReg)[0];
                  return arrIndices.reduce((agg:any, i:any) => agg[i], obj[name]);
                }

                return obj[i];
              }

              let reducedValue = innerMatchValue[1].split('.').reduce(index, r)
              if(typeof reducedValue !== 'undefined') {
                // replace the string with the new value
                (<any>obj)[item] = (<any>obj)[item].replace(m, reducedValue)
              } else {
                returnVal = `There is no corresponding response value to ${chalk.bold(innerMatchValue[1])}`;
                return;
              }
            } catch(e) {
              returnVal = e;
              return;
            }
          }
        });
        if(returnVal !== null) {
          return returnVal;
        }
      }

      // find all Fake(...) strings in any item
      if(regFake.test(val) === true) {
        let outterMatch = val.match(regFake);
        outterMatch.forEach((m: string) => {
          const innerMatch = m.match(innerReg);
          if(innerMatch !== null) {
            try {
              let fakerString = faker.fake(`{{${innerMatch[1]}}}`);
              (<any>obj)[item] = (<any>obj)[item].replace(m, fakerString);
            } catch(e) {
              return e;
            }
          }
        });
      }
      // find all Env(...) strings in any item
      if (regEnv.test(val) === true) {
        let outterMatch = val.match(regEnv);
        outterMatch.forEach((m: string) => {
          const innerMatch = m.match(innerReg);
          if (innerMatch !== null) {
            try {
              (<any>obj)[item] = (<any>obj)[item].replace(m, process.env[innerMatch[1]]);
            } catch (e) {
              return e;
            }
          }
        });
      }
      // find all Variable(...) or Var(...) strings in any item
      if (regLongVar.test(val) === true || regShortVar.test(val) === true) {
        let outterMatch = val.match(regLongVar) || val.match(regShortVar);
        outterMatch.forEach((m: string) => {
          const innerMatch = m.match(innerReg);
          if (innerMatch !== null) {
            try {
              let correspondingItem = definedVariables[innerMatch[1]];

              (<any>obj)[item] = (<any>obj)[item].replace(m, correspondingItem);
            } catch (e) {
              return e;
            }
          }
        });
      }
    }
  }
  return null;
}

/**
 * Print out a formatted Validation error
 */
const validationError = (message: string) => {
  return `[ Validation ] ${message}`
}

/**
 * Checks whether a type matches the dataToProof
 * @param type 
 * @param dataToProof 
 */
export const validateType = (type: string, dataToProof: any) => {  
  
  switch(type) {
    // strings
    case "string":
      return Joi.validate(dataToProof, Joi.string()).error === null
    case "string.hex":
      return Joi.validate(dataToProof, Joi.string().hex()).error === null
    case "string.email":
      return Joi.validate(dataToProof, Joi.string().email()).error === null
    case "string.ip":
      return Joi.validate(dataToProof, Joi.string().ip()).error === null
    case "string.url":
    case "string.uri":
      return Joi.validate(dataToProof, Joi.string().uri()).error === null
    case "string.lowercase":
      return Joi.validate(dataToProof, Joi.string().lowercase()).error === null
    case "string.uppercase":
      return Joi.validate(dataToProof, Joi.string().uppercase()).error === null
    case "string.base64":
      return Joi.validate(dataToProof, Joi.string().base64()).error === null
    // boolean
    case "bool":
    case "boolean":
      return Joi.validate(dataToProof, Joi.boolean()).error === null
    // object
    case "object":
      return Joi.validate(dataToProof, Joi.object()).error === null
    // array
    case "array":
      return Joi.validate(dataToProof, Joi.array()).error === null
    // number
    case "number":
      return Joi.validate(dataToProof, Joi.number()).error === null
    case "number.positive":
      return Joi.validate(dataToProof, Joi.number().positive()).error === null
    case "number.negative":
      return Joi.validate(dataToProof, Joi.number().negative()).error === null
    case "null":
      return Joi.validate(dataToProof, Joi.allow(null)).error === null
    default: 
      return undefined;
  };
} 

/**
 * Validate one object
 * @param obj 
 */
function validateObjectFunc(validateObject: any, dataObj: any, key: any) {

      if(typeof dataObj[key] === 'undefined') {
        return validationError(`The key ${chalk.bold(key)} was defined in the validation schema but there was no equivalent found in the response data.`)
      }

      const regex = /Type\((.*?)\)/
      // test if the validation schema is a custom Type validation e.g. username: Type(String)
      if(regex.test(validateObject[key])) {
        const fullValue: any = regex.exec(validateObject[key]);
          
        let types = fullValue[1].replace(/\s/g,'').toLowerCase().split('|')

        let confirmCounter = 0;

        for(let type of types){
          let c = validateType(type, dataObj[key]);
          if(typeof c !== 'undefined') {
            if(c === false) {
              if(types.length === 1) {
                return validationError(`The value of ${chalk.bold(key)} should be of type ${chalk.bold(type)} but it has a different type`);
              }
            } else {
              if(types.length === 1) {
                return null;
              }
              confirmCounter++;
            }
          } else {
            return validationError(`The type ${chalk.bold(type)} does not exist. Please use a valid type.`)
          }
        }
        if(confirmCounter === 0) {
          return validationError(`The value of ${chalk.bold(key)} doesn't match with any of the given types`);
        }
      } else {
        // if the validation is a custom value -> the response data at this key has to match this value
        if(validateObject[key] !== dataObj[key]) {
          return validationError(`The value of ${chalk.bold(key)} should have been ${chalk.bold(validateObject[key])} but instead it was ${chalk.bold(dataObj[key])}`)
        } else {
          return null;
        }
      }
  return null;
}
/**
 * Loop recursively through all object
 * @param validateSchema 
 * @param dataToProof 
 */
const createValidationLoop = (proofObject: any, dataToProof: any, key: any) => { 
  if(typeof dataToProof[key] === 'undefined') {
    return validationError(`The required item ${chalk.bold(key)} wasn't found in the response data`)
  }
  if(typeof proofObject[key] === 'object') {
    
    for(let l in proofObject[key]) {
      let err: any = createValidationLoop(proofObject[key], dataToProof[key], l);
      if(err !== null) {
        return err;
      }
    }
  } else {
    let err = validateObjectFunc(proofObject, dataToProof, key);
    if(err !== null) {
      return err;
    }
  }
  return null;
}

/**
 * Validate a response with the given schema
 * @param validateSchema
 * @param headers
 */
const validateHeaders = (validateSchema: any, headers: any) => {
  /**
   * Example:
   * validate:
   *  headers:
   *    content-type: application/json; charset=utf-8
   */
  let headersProofObject: any = validateSchema.headers;

  if(typeof headersProofObject === 'object') {
    for(let key in headersProofObject) {
      let err = createValidationLoop(headersProofObject, headers, key)
      if(err !== null) {
        return err;
      }
    }
  }

  return null;
}


/**
 * Validate a response with the given schema
 * @param validateSchema 
 * @param dataToProof
 */
const validateResponse = (validateSchema: any, dataToProof: any) => {
  /**
   * Example:
   * validate:
   *  token: Type(string | null)
   */

  let proofObject: any = validateSchema.json || validateSchema.raw || null;
  
  if(typeof proofObject === 'object') {
    for(let key in proofObject) {
      let err = createValidationLoop(proofObject, dataToProof, key)
      if(err !== null) {
        return err;
      }
    }
  }
  if(typeof proofObject === 'string') {
    if(dataToProof === proofObject) {
      return null;
    } else {
      return validationError(`The response value should have been ${chalk.bold(proofObject)} but instead it was ${chalk.bold(dataToProof)}`);
    }
  }

  return null;
}

/**
 * Validate a response with the given schema
 * @param validateSchema
 * @param response
 */
const validateJp = (validateSchema: any, dataToProof: any) => {
  /**
   * Example:
   * validate:
   *  jq:
   *    foo.bar: 1
   */

  let proofObject: any = validateSchema;

  for (let key in proofObject) {
    let value = proofObject[key];
    let jsonPathValue = jp.value(dataToProof, key)
    if(jsonPathValue === value){
      } else {
        return validationError(`The JSON response value should have been ${chalk.bold(value)} but instead it was ${chalk.bold(jsonPathValue)}`);
      }
    }
  return null;
}

/**
 * Validate a response with the given schema
 * @param validateSchema
 * @param code
 */
const validateCode = (validateSchema: number | string, code: number) => {
  /**
   * Example:
   * validate:
   *  code: 200
   */

  const codeChars = validateSchema.toString().split('');
  const dataChars = code.toString().split('');
  for (let i = 0; i < codeChars.length; i++) {
    const ch = codeChars[i];
    const dataCh = dataChars[i];
    if (ch !== 'x' && dataCh !== ch) {
      return validationError(`The response status code should be ${chalk.bold(validateSchema.toString())} but the request returned code ${chalk.bold(code.toString())}`);
    }
  }
  return null;
}

/**
 * Perform the Request
 * @param requestObject All config data
 * @param requestName Name of the request
 * @param printAll If true, all response information will be logged in the console
 */
const performRequest = async (requestObject: requestObjectSchema, requestName: string, printAll: boolean) => {

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

  if(typeof requestObject.auth !== 'undefined') {
    if(typeof requestObject.auth.basic !== 'undefined') {
      const username = requestObject.auth.basic.username;
      const password = requestObject.auth.basic.password;

      const encoded = Buffer.from(username + ':' + password).toString('base64');
      if(typeof axiosObject.headers === 'undefined') {
        axiosObject.headers = {Authorization:null}
      }
      axiosObject.headers.Authorization = `Basic ${encoded}`;
    }
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
        if(requestObject.data.params.startsWith('?')){
          axiosObject.url += requestObject.data.params;
        } else {
          axiosObject.url += '?'+requestObject.data.params;
        }
      }
      // stringify params
      if(typeof requestObject.data.params === 'object') {
        axiosObject.url += '?' + qs.stringify(requestObject.data.params)
      }
    }

  }

  try {
    const response = await axios(axiosObject)
    if(typeof response.data !== 'undefined') {
      requestReponses[requestName] = response.data;
    } 
    
    const req = response.request;

    if(typeof requestObject.validate !== 'undefined') {

      if(typeof requestObject.validate.code !== 'undefined'){
        const err = validateCode(requestObject.validate.code.toString(), response.status);
        if(err !== null) {
          return { isError: true, message: err, code: 1 }
        }
      }
      if(requestObject.validate.jsonpath){
        const err = validateJp(requestObject.validate.jsonpath, response.data);
        if(err !== null) {
          return { isError: true, message: err, code: 1 }
        }
      }
      if(requestObject.validate.headers){
        const err = validateHeaders(requestObject.validate, response.headers);
        if(err !== null) {
          return { isError: true, message: err, code: 1 }
        }
      }
      if(requestObject.validate.raw || requestObject.validate.json){
        const err = validateResponse(requestObject.validate, response.data);

        if(err !== null) {
          return { isError: true, message: err, code: 1 }
        }
      }
    }

    // if the result should be logged
    if(requestObject.log === true || requestObject.log == 'true' || printAll === true) {
      return { isError: false, message: response, code: 0, curl: req.toCurl() }
    }

    return { isError: false, message: null, code: 0, curl: req.toCurl() }
  
  } catch(e) {
    if(typeof requestObject.validate !== 'undefined') {
      if(typeof requestObject.validate.code !== 'undefined') {
        const vErr = validateCode(requestObject.validate.code, e.response.status);
        if(vErr === null) {
          return { 
            isError: false, 
            message: null,
            code: 0
          };
        } else {
          return { 
            isError: true, 
            message: vErr,
            code: 1,
          };
        }
      }
    }

    return { isError: true, message: e, code: 1 }
  }
  
}
