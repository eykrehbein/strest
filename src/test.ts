import chalk from 'chalk';
import * as Joi from 'joi';
import * as ora from 'ora';
import axios, { AxiosResponse } from 'axios';
import * as qs from 'qs';
import * as faker from 'faker';
import { colorizeMain, colorizeCustomRed } from './handler';
import { requestObjectSchema as requestObjectSchema } from './configSchema';
import { config } from './configLoader';


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
 * @param printAll If true, all response information will be logged in the console
 */
export const performTests = async (testObjects: object[], printAll: boolean) => {
  let testObject: any
  let abortBecauseTestFailed = false;
  
  for(testObject of testObjects){ 
    
    if(!abortBecauseTestFailed){
    
      const requests = testObject['requests'];
      for(let requestName in requests) {
    
        if(!abortBecauseTestFailed) {
          
          const val = requests[requestName];
  
          const spinner = ora(`Testing ${chalk.bold(colorizeMain(requestName))}`).start();
          const startTime = new Date().getTime();
          
          let error = await performRequest(val, requestName, printAll);
          
          const endTime = new Date().getTime();
          const execTime = (endTime - startTime) / 1000;
  
          if(error.isError === true) {
            spinner.clear();
            console.log();
            spinner.fail(colorizeCustomRed(`Testing ${chalk.bold(colorizeCustomRed(requestName))} failed (${chalk.bold(`${execTime.toString()}s`)}) \n\n${error.message}`))
            // if one test failed, don't run others
            abortBecauseTestFailed = true;
            return error.code;
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
                `Testing ${chalk.bold(colorizeMain(requestName))} succeeded (${chalk.bold(`${execTime.toString()}s`)})` +
                `\n\n${colorizeMain('Status')}: ${res.status}`+
                `\n${colorizeMain('Status Text')}: ${res.statusText}` +
                `\n\n${colorizeMain('Headers')}: \n\n${chalk.hex(config.secondaryColor)(JSON.stringify(res.headers, null ,2))}` +
                `${dataString}`
              )
            } else {
              spinner.succeed(`Testing ${chalk.bold(colorizeMain(requestName))} succeeded (${chalk.bold(`${execTime.toString()}s`)})`)
            }
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
  const reg = /Value\((.*?)\)/
  const regFake = /Fake\((.*?)\)/g
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
      if(reg.test(val) === true) {
        // get the value out of the string
        let fullValue = reg.exec(val)!;
   

         // DOTNOTATION TO OBJECT REFERENCE
          // get the dot notation string
          let dotNotationFullMatch = innerReg.exec(fullValue[0])!;
          const dotNotation = dotNotationFullMatch[1]!;

          try {
            const index = (obj: any ,i:any) => obj[i]
            let reducedValue = dotNotation.split('.').reduce(index, r)

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
        console.log((<any>obj)[item])
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
 */
const validateResponse = (validateSchema: any, dataToProof: any) => {
  /**
   * Example:
   * validate:
   *  token: Type(string | null)
   */
  let proofObject: any = validateSchema.json || validateSchema.raw;

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
 * Perform the Request
 * @param requestObject All config data
 * @param requestName Name of the request
 * @param printAll If true, all response information will be logged in the console
 */
const performRequest = async (requestObject: requestObjectSchema, requestName: string, printAll: boolean) => {

  const error = computeRequestObject(requestObject, requestReponses);

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

    if(typeof requestObject.validate !== 'undefined') {
     
      const err = validateResponse(requestObject.validate, response.data);

      if(err !== null) {
        return { isError: true, message: err, code: 400}
      }
    }

    // if the result should be logged
    if(requestObject.log === true || printAll === true) {
      return { isError: false, message: response, code: 0 }
    }

    return {isError: false, message: null, code: 0}
  
  } catch(e) {
    return { isError: true, message: e, code: 1}
  }
  
}
