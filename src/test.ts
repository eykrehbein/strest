import chalk from 'chalk';
import * as Joi from 'joi';
import * as ora from 'ora';
import axios from 'axios';
import * as faker from 'faker';
import { colorizeMain, colorizeCustomRed } from './handler';
import { requestsObjectSchema as requestsObjectSchema } from './configSchema';
import { config } from './configLoader';
import * as jp from 'jsonpath';
import * as nunjucks from 'nunjucks';
import * as yaml from 'js-yaml';
import * as jsonfile  from 'jsonfile'
import * as path from 'path';
import * as Ajv from 'ajv';
var deepEql = require("deep-eql");
var lineNumber = require('line-number');
var getLineFromPos = require('get-line-from-pos');

require('request-to-curl');

const nunjucksEnv = nunjucks.configure(".", {
  tags: {
    blockStart: '<%',
    blockEnd: '%>',
    variableStart: '<$',
    variableEnd: '$>',
    commentStart: '<#',
    commentEnd: '#>'
  },
  throwOnUndefined: true
});
nunjucksEnv.addGlobal('Faker', function (faked: string) {
  return faker.fake(`{{${faked}}}`);
})

nunjucksEnv.addGlobal('Env', function (envi: string) {
  const environ = process.env[envi]
  return environ;
})

/**
 * All Data that any request returns, will be stored here. After that it can be used in the following methods
 */
const requestReponses: Map<string, object> = new Map<string, object>()

// The manually defined variables 
// Usable through <% variableName %>
let definedVariables: any = {

}

/**
 * Main handler that will perform the tests with each valid test object
 * @param testObjects 
 * @param printAll If true, all response information will be logged in the console
 */
export const performTests = async (testObjects: object[], cmd: any) => {
  let testObject: any
  let abortBecauseTestFailed = false;

  const printAll = cmd.print;
  // true if the options are set was set
  const toCurl = cmd.output == 'curl';

  // Load existing objects
  if (cmd.load) {
    const fileName = "strest_history.json"
    let fileMap: Map<string, object> = new Map<string, object>()
    try {
      fileMap = new Map(Object.entries(jsonfile.readFileSync(fileName)))
    } catch {
      // Oh well, but whatever...
    }
    fileMap.forEach(function(value, key){
      requestReponses.set(key, value)
    })
  }

  let curPath = "./";
  if (testObjects.length > 1) {
    console.log(chalk.blueBright("Executing tests in " + curPath));
  }
  for (testObject of testObjects) {

    if (testObject['allowInsecure']) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    if (testObject['variables']) {
      // merge the existing variables with the new to allow multiple testfiles
      // to use variables from previous files
      definedVariables = {
        ...definedVariables,
        ...testObject['variables']
      }
    }

    if (curPath != testObject.relativePath && testObjects.length > 1) {
      console.log(chalk.blueBright("Executing tests in: " + testObject.relativePath));
    }
    curPath = testObject.relativePath
    if (!abortBecauseTestFailed) {

      const requests = testObject['requests'];
      for (let requestName in requests) {
        let bypass = false
        if (cmd.key){
          bypass = true
          if (cmd.key == requestName) {
            bypass = false
          }
        }

        if (!abortBecauseTestFailed && !bypass) {
          const val: requestsObjectSchema = requests[requestName];

          let runTimes = 1;
          if (typeof val.maxRetries !== 'undefined') {
            runTimes = val.maxRetries;
          }
          for (let i = 0; i != runTimes; i++) {
            // Delay for the specified number of milliseconds if given
            if (typeof val.delay !== 'undefined') {
              const waitSpinner = ora(`Waiting for ${chalk.bold(colorizeMain(val.delay.toString()))} milliseconds`).start();

              await function () {
                return new Promise(resolve => setTimeout(resolve, val.delay));
              }();

              waitSpinner.stop();
            }

            const spinner = ora(`Testing ${chalk.bold(colorizeMain(requestName))}`).start();
            const startTime = new Date().getTime();
            let result = "succeeded"
            let error = null
            const requestReponsesObj = Array.from(requestReponses.entries()).reduce((main, [key, value]) => ({...main, [key]: value}), {})
            let keys = Object.keys(requests);
            let nextIndex = keys.indexOf(requestName) +1;
            let nextRequest = keys[nextIndex];
            let computed = computeRequestObject(requestReponsesObj, testObject.raw, requestName, nextRequest);
            if (computed.error) {
              error = { isError: true, message: computed.message, har: null, code: 0 }
            }
            if (error == null) {
              if (typeof computed.parsed.if !== 'undefined') {
                if (computed.parsed.if.operand == computed.parsed.if.equals) {
                  error = await performRequest(computed.parsed, requestName, printAll);
                } else {
                  result = "skipped"
                  error = { isError: false, message: null, har: null, code: 0 }
                }
              } else {
                error = await performRequest(computed.parsed, requestName, printAll);
              }
            }

            const endTime = new Date().getTime();
            const execTime = (endTime - startTime) / 1000;

            if (error.isError === true) {
              if (runTimes === 1) {
                spinner.clear();
                spinner.fail(colorizeCustomRed(`Testing ${chalk.bold(colorizeCustomRed(requestName))} failed (${chalk.bold(`${execTime.toString()}s`)}) \n${error.message}\n`))
                if (error.curl) {
                  console.log("Request: " + JSON.stringify(error.curl, null, 2))
                }
                console.log("Response: \n" + JSON.stringify(error.har, null, 2))
                if (!cmd.noExit) {
                  return 1;
                }
              } else {
                if (runTimes - 1 === i) {
                  spinner.fail(colorizeCustomRed(`Testing ${chalk.bold(colorizeCustomRed(requestName))} failed to validate within ${chalk.bold(colorizeCustomRed(runTimes.toString()))} (${chalk.bold(`${execTime.toString()}s`)}) \n${error.message}\n`))
                  abortBecauseTestFailed = true;
                  if (!cmd.noExit) {
                    return 1;
                  }
                } else {
                  spinner.fail(colorizeCustomRed(`Testing ${chalk.bold(colorizeCustomRed(requestName))} failed to validate. Retrying (${chalk.bold((runTimes - i).toString())})... (${chalk.bold(`${execTime.toString()}s`)}) \n${error.message}\n`))
                  continue
                }
              }
            } else {
              let har = error.har
              if (har) {
                // log the response info and data
                let dataString = '';
                if ('content' in har) {
                  dataString = `\n\n${colorizeMain('Content')}: \n\n${chalk.hex(config.secondaryColor)(JSON.stringify(har.content, null, 2))}\n`;
                } else {
                  dataString = `\n\n${colorizeMain('Content')}: No Content received\n`;
                }
                spinner.succeed(
                  `Testing ${chalk.bold(colorizeMain(requestName))} ${result} (${chalk.bold(`${execTime.toString()}s`)})` +
                  `\n\n${colorizeMain('Status')}: ${har.status}` +
                  `\n${colorizeMain('Status Text')}: ${har.statusText}` +
                  `\n\n${colorizeMain('Headers')}: \n\n${chalk.hex(config.secondaryColor)(JSON.stringify(har.headers, null, 2))}` +
                  `${dataString}`
                )
              } else {
                if (result === "skipped") {
                  spinner.succeed(`Skipped Testing ${chalk.bold(colorizeMain(requestName))} ${result} (${chalk.bold(`${execTime.toString()}s`)})`)
                } else {
                  spinner.succeed(`Testing ${chalk.bold(colorizeMain(requestName))} ${result} (${chalk.bold(`${execTime.toString()}s`)})`)
                }
              }
            }
            if (toCurl === true) {
              console.log(`\n${colorizeMain('Curl Equivalent: ')}${chalk.grey(error.curl)}\n`);
            }
            break
          }
        }
      }
    }
  }
  if (cmd.save) {
    const fileName = path.join(process.cwd(), "strest_history.json");
    let fileMap: Map<string, object> = new Map<string, object>()
    try {
      fileMap = new Map(Object.entries(jsonfile.readFileSync(fileName)))
    } catch {
      // Oh well, but whatever...
    }
    let definedVariablesMap = new Map(Object.entries(definedVariables))
    definedVariablesMap.forEach(function(value, key){
      fileMap.set(key, value)
    })
    requestReponses.forEach(function(value, key){
      fileMap.set(key, value)
    })
    let resultOrder = Array.from(fileMap.entries()).reduce((main, [key, value]) => ({...main, [key]: value}), {})
    jsonfile.writeFileSync(fileName, resultOrder, { spaces: 2, EOL: '\r\n'})
  }
  return 0;
}

/**
 * Use nunjucks to replace and update the object
 * @param obj working obj
 */
export const computeRequestObject = (r: any, raw: string, requestName: string, nextRequest: string) => {

  let merged = { ...r, ...definedVariables };
  nunjucksEnv.addGlobal('JsonPath', function (path: string) {
    return jp.value(merged, path)
  })
  // Parse obj using nunjucks
  try {
    const regexpStart = new RegExp("^\\s{1,6}" + requestName + ":","gm")
    const regexpEnd = new RegExp("^\\s{1,6}" + nextRequest + ":","gm")

    let last = getLineFromPos(raw, -1)
    let start = lineNumber(raw, regexpStart)
    let end = lineNumber(raw, regexpEnd)

    start = start[0].number
    if (end == "") {
      end = last + 1
    } else {
      end = end[0].number
    }
    let lines = raw.split("\n")
    var newRaw = lines.slice(start, end - 1).join("\n")
    let converted = nunjucksEnv.renderString(newRaw, merged)
    const parsed: any = yaml.load(converted)
    return {parsed: parsed, error: null}
  } catch (e) {
    let err = validationError(`Failed to process ${requestName} request line using nunjucks:\n ${e}`);
    return { parsed: null, error: true, message: err}
  }
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
export const validateType = (type: Array<string>, dataToProof: any): boolean => {
  function isType(elem: string) {
    switch (elem.toLowerCase()) {
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
        return false;
    }
  }
  return type.some(isType)
}

/**
 * Perform the Request
 * @param requestObject All config data
 * @param requestName Name of the request
 * @param printAll If true, all response information will be logged in the console
 */
const performRequest = async (requestObject: requestsObjectSchema, requestName: string, printAll: boolean) => {

  // parse the requestObject
  // let requestMethod: string, requestData: any, requestUrl: string, requestHeaders: any, requestParams: string;
  interface AxiosObject {
    url?: any,
    method?: any,
    data?: any,
    params?: any,
    headers?: any,
    validateStatus?: any
  }

  let axiosObject: AxiosObject = {};
  // optional keys 
  axiosObject.url = requestObject.request.url;
  axiosObject.method = requestObject.request.method;
  axiosObject.headers = {}
  // headers
  if (typeof requestObject.request.headers !== 'undefined') {
    requestObject.request.headers.map((header) => {
      axiosObject.headers[header.name] = header.value
    })
  }

  //Basic Auth
  if (typeof requestObject.auth !== 'undefined') {
    if (typeof requestObject.auth.basic !== 'undefined') {
      const username = requestObject.auth.basic.username;
      const password = requestObject.auth.basic.password;
      const encoded = Buffer.from(username + ':' + password).toString('base64');
      axiosObject.headers["Authorization"] = `Basic ${encoded}`;
    }
  }

  // queryString
  if (typeof requestObject.request.queryString !== 'undefined') {
    let queryString = "?"
    for (let item of requestObject.request.queryString) {
      queryString += item.name + "=" + item.value + "&"
    }
    axiosObject.url += queryString.slice(0, -1)
  }

  // data
  if (typeof requestObject.request.postData !== 'undefined') {
    axiosObject.headers["Content-Type"] = requestObject.request.postData.mimeType
    if (requestObject.request.postData.text) {
      axiosObject.data = requestObject.request.postData.text;
    }
  }

  try {
    let axiosInstance = axios.create({
      validateStatus: function (status) {
        return status < 500; // Reject only if the status code is greater than or equal to 500
      }
    })
    let response = await axiosInstance(axiosObject)

    // Convert response to har object structure
    const har = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      content: response.data
    }

    requestReponses.set(requestName, har)
    let message = ""
    if ('validate' in requestObject) {
      for (let validate of requestObject.validate) {
        let jsonPathValue = jp.value(har, validate.jsonpath)
        if (!jsonPathValue) {
          let err = validationError(`The jsonpath ${chalk.bold(validate.jsonpath)} resolved to ${chalk.bold(typeof jsonPathValue)}`);
          return { isError: true, har: har, message: err, code: 1, curl: response.request.toCurl() }
        }
        if (validate.expect) {
          let expectResult = validate.expect
          let valueResult = jsonPathValue
          if (typeof validate.expect == "object") {
            expectResult = JSON.stringify(validate.expect)
          }
          if (typeof jsonPathValue == "object") {
            valueResult = JSON.stringify(jsonPathValue)
          }
          if (! deepEql(validate.expect, jsonPathValue)) {
            let err = validationError(`The JSON response value should have been ${chalk.bold(expectResult)} but instead it was ${chalk.bold(valueResult)}`);
            return { isError: true, har: har, message: err, code: 1, curl: response.request.toCurl() }
          } else {
            message = message + "jsonpath " + validate.jsonpath + "(" + expectResult + ")" + " equals " + valueResult + "\n"
          }
        }
        if (validate.type) {
          let validated = validateType(validate.type, jsonPathValue)
          if (!validated) {
            let err = validationError(`The Type should have been ${chalk.bold(validate.type.toString())} but instead it was ${chalk.bold(typeof jsonPathValue)}`);
            return { isError: true, har: har, message: err, code: 1, curl: response.request.toCurl() }
          } else {
            message = message + "jsonpath " + validate.jsonpath + "(" + jsonPathValue + ")" + " type equals " + validate.type + "\n"
          }
        }
        if (validate.jsonschema) {
          var ajv = new Ajv();
          let validated = ajv.validate(validate.jsonschema, jsonPathValue);
          if (!validated) {
            let err = validationError(`The jsonschema ${chalk.bold(JSON.stringify(validate.jsonschema))} did not validate against ${chalk.bold(JSON.stringify(jsonPathValue))}`);
            return { isError: true, har: har, message: err, code: 1, curl: response.request.toCurl() }
          } else {
            message = message + "jsonpath " + validate.jsonpath + "(" + jsonPathValue + ")" + " jsonschema validated on " + validate.jsonschema + "\n"
          }
        }
        if (validate.regex) {
          let regex = RegExp(validate.regex);
          let validated = regex.test(jsonPathValue)
          if (!validated) {
            let err = validationError(`The regex ${chalk.bold(validate.regex.toString())} did not return a match against ${chalk.bold(jsonPathValue)}`);
            return { isError: true, har: har, message: err, code: 1, curl: response.request.toCurl() }
          } else {
            message = message + "jsonpath " + validate.jsonpath + "(" + jsonPathValue + ")" + " regex return a match on " + validate.regex + "\n"
          }
        }
      }
    }
    // if the result should be logged
    if (requestObject.log === true || requestObject.log == 'true' || printAll === true) {
      return { isError: false, har: har, message: message, code: 0, curl: response.request.toCurl() }
    }
    return { isError: false, har: null, message: message, code: 0, curl: response.request.toCurl() }
  } catch (e) {
    console.log("\nFailed request object: \n" + JSON.stringify(axiosObject, null, 2))
    return { isError: true, har: null, message: e, code: 1 }
  }
}
