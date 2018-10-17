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
  raw: Joi.string().optional()
})
  .without('json', 'raw')
  .without('raw', 'json');

const requestsSchema = Joi.object().keys({
  url: Joi.string().required(),
  method: Joi.string().required(),
  data: dataSchema.optional(),
  headers: Joi.object().optional(),
  validate: validateSchema.optional(),
  log: Joi.alternatives().try(Joi.boolean(), Joi.string().regex(/^ENV/gmi)).optional(),
  delay: Joi.number().optional(),
})


export const Schema = Joi.object({
  version: Joi.number().min(1).max(1),
  requests: Joi.object({}).pattern(/([^\s]+)/, requestsSchema),
  allowInsecure: Joi.boolean().optional()
});


// Typescript Schemas

interface requestObjectDataSchema {
  json: object,
  params: object | string ,
  raw: string
}

export interface requestObjectSchema {
  delay: number,
  method: string,
  url: string,
  data: requestObjectDataSchema,
  headers: object,
  validate: any,
  log: boolean | string,
}


