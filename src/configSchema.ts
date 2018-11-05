import * as Joi from 'joi';
// Uses spec from: http://www.softwareishard.com/blog/har-12-spec/

const ifSchema = Joi.object().keys({
  operand: Joi.string().required(),
  equals: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
})

const authSchema = Joi.object().keys({
  basic: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }).optional()
})

const cookieSchema = Joi.object().keys({
  name: Joi.string().required(),
  value: Joi.string().required(),
  path: Joi.string().optional(),
  domain: Joi.string().optional(),
  expires: Joi.string().optional(),
  httpOnly: Joi.boolean().optional(),
  secure: Joi.boolean().optional(),
  comment: Joi.string().optional()
})

const headerSchema = Joi.object().keys({
  name: Joi.string().required(),
  value: Joi.string().required(),
  // comment: Joi.string().optional()
})

const queryStringSchema = Joi.object().keys({
  name: Joi.string().required(),
  value: Joi.string().required(),
  // comment: Joi.string().optional()
})

const postDataSchema = Joi.object().keys({
  mimeType: Joi.string().required(),
  params: Joi.object().optional(),
  text : Joi.string().optional(),
  comment: Joi.string().optional(),
}).without('text', 'params')
  .without('params', 'text')

const requestSchema = Joi.object().keys({
  url: Joi.string().required(),
  method: Joi.string().required(),
  postData: postDataSchema.optional(),
  // httpVersion: Joi.string().optional(),
  headers: Joi.array().items(headerSchema).optional(),
  queryString: Joi.array().items(queryStringSchema).optional(),
  cookies: Joi.array().items(cookieSchema).optional(),
})

const jsonPathSchema = Joi.object().pattern(/\w+/, Joi.string());

export const responseSchema = Joi.object().keys({
  // This is the strict response schema.  It can be used to validate and log responses
  status: Joi.number().required(),
  _validateStatus: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
  statusText: Joi.string().optional(),
  _validateStatusText: Joi.string().optional(),
  httpVersion: Joi.string().optional(),
  _validateHttpVersion: Joi.string().optional(),
  cookies: Joi.array().items(cookieSchema).optional(),
  headers: Joi.array().items(headerSchema).optional(),
  content: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
  redirectURL: Joi.string().optional(),
  headersSize: Joi.number().optional(),
  bodySize: Joi.number().optional(),
  comment: Joi.string().optional(),
  _validateJsonPath: Joi.array().items(jsonPathSchema),
})

const requestsSchema = Joi.object().keys({
  delay: Joi.number().optional(),
  maxRetries: Joi.number().optional(),
  if: ifSchema.optional(),
  request: requestSchema.required(),
  response: responseSchema.optional(),
  log: Joi.alternatives().try(Joi.boolean(), Joi.string().optional()),
  auth: authSchema.optional(),
})

const requestNameSchema = Joi.object().pattern(/\w+/, requestsSchema);

export const Schema = Joi.object({
  version: Joi.number().min(1).max(1),
  requests: requestNameSchema,
  allowInsecure: Joi.boolean().optional(),
  variables: Joi.object().optional(),
  // Created dynamically
  raw: Joi.string().required(),
  relativePath: Joi.string().required(),
});

export const BulkSchema = Joi.array().items(Joi.string());

// Typescript Schemas

interface requestObjectSchema {
  url: string,
  method: string,
  postData: postDataObjectSchema,
  headers: Array<Object>,
  queryString: Array<Object>,
  cookies: Array<Object>,
}

interface postDataObjectSchema {
  mimeType: string,
  params: object,
  text : string,
  comment: string,
}

interface authObjectSchema {
  basic: {
    username: string,
    password: string,
  }
}

interface responseObjectSchema {
  // This is the strict response schema.  It can be used to validate and log responses
  status: number,
  _validateStatus: string | number,
  statusText: string,
  _validateStatusText: string,
  httpVersion: string,
  _validateHttpVersion: string,
  cookies: Array<Object>,
  _validateCookies: Array<Object>,
  headers: Array<Object>,
  _validateHeaders: Array<Object>,
  content: any,
  _validateContent: any,
  redirectURL: string,
  headersSize: string,
  bodySize: string,
  comment: string,
  _validateJsonPath: Array<Object>,
}

export interface requestsObjectSchema {
  delay: number,
  maxRetries: number,
  if: object,
  request: requestObjectSchema,
  response: responseObjectSchema,
  log: boolean | string,
  auth: authObjectSchema,
}
