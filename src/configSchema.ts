import * as Joi from 'joi';

const dataSchema = Joi.object().keys({
  json: Joi.object().optional(), // data as JSON Body
  params: Joi.object().optional(), // data as url-params
  formUrlEncoded: Joi.object().optional() // form url-encoded data
}).min(1)

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
  data: dataSchema.required(),
  headers: Joi.object().optional(),
  response: responseSchema.optional()
})


export const Schema = Joi.object({
  version: Joi.number().min(1).max(1),
  requests: Joi.object({}).pattern(/([^\s]+)/, requestsSchema)
});