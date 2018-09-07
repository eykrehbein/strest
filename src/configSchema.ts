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

const responseSchema = Joi.object().keys({
  validate: Joi.object().keys({
    code: Joi.number().optional(),
    json: Joi.object().optional(),
    raw: Joi.any().optional()
  })
})

const requestsSchema = Joi.object().keys({
  url: Joi.string().required(),
  method: Joi.string().required(),
  data: dataSchema.optional(),
  headers: Joi.object().optional(),
  response: responseSchema.optional()
})


export const Schema = Joi.object({
  version: Joi.number().min(1).max(1),
  requests: Joi.object({}).pattern(/([^\s]+)/, requestsSchema)
});


// Typescript Schemas

interface requestObjectDataSchema {
  json: object,
  params: object | string ,
  raw: string
}

export interface requestObjectSchema {
  method: string,
  url: string,
  data: requestObjectDataSchema,
  headers: object,
  response: object
}


