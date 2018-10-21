import * as Joi from 'joi';

const dataSchema = Joi.object().keys({
  json: Joi.object().optional(), // data as JSON Body
  params: Joi.alternatives().try(Joi.string(), Joi.object()).optional(), // data as url-params
  raw: Joi.string().optional()
}).min(1).max(2)
  .without('json', 'formUrlEncoded')
  .without('formUrlEncoded', 'json')
  .without('json', 'raw')
  .without('raw', 'json')
  .without('formUrlEncoded', 'raw')
  .without('raw', 'formUrlEncoded')

const validateSchema = Joi.object().keys({
  max_retries: Joi.number().optional(),
  code: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  headers: Joi.object().optional(),
  json: Joi.object().optional(),
  raw: Joi.alternatives().try(Joi.string().optional(), Joi.string().regex(/^ENV/gmi)).optional(),
  jsonpath: Joi.object().optional(),
})
  .without('json', 'raw')
  .without('raw', 'json')
  .without('raw', 'jsonpath')
  .without('jsonpath', 'raw');

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

const logSchema = Joi.object().keys({
  response_to_console: Joi.alternatives().try(Joi.boolean(), Joi.string().regex(/^ENV/gmi)).optional(),
  response_to_file: Joi.alternatives().try(Joi.boolean(), Joi.string().regex(/^ENV/gmi)).optional(),
})

const requestsSchema = Joi.object().keys({
  url: Joi.string().required(),
  method: Joi.string().required(),
  data: dataSchema.optional(),
  headers: Joi.object().optional(),
  validate: validateSchema.optional(),
  log: logSchema.optional(),
  delay: Joi.number().optional(),
  if: ifSchema.optional(),
  auth: authSchema.optional(),
})

export const Schema = Joi.object({
  version: Joi.number().min(1).max(1),
  requests: Joi.object({}).pattern(/([^\s]+)/, requestsSchema),
  allowInsecure: Joi.boolean().optional(),
  variables: Joi.object().optional()
});

// Typescript Schemas

interface requestObjectDataSchema {
  json: object,
  params: object | string ,
  raw: string
}
interface basicObjectSchema {
  username: string,
  password: string
}

interface authObjectSchema {
  basic: basicObjectSchema
}

interface logObjectDataSchema {
  response_to_console: boolean | string,
  response_to_file: boolean | string
}

export interface requestObjectSchema {
  delay: number,
  if: object,
  auth: authObjectSchema,
  method: string,
  url: string,
  data: requestObjectDataSchema,
  headers: object,
  validate: any,
  log: logObjectDataSchema,
}
