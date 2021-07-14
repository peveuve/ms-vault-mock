const Joi = require('joi')

const AttributesModel = Joi.object().keys({
  created: Joi.number().integer().positive(),
  updated: Joi.number().integer().positive(),
  exp: Joi.number().integer().positive(),
  nbf: Joi.number().integer().positive(),
  enabled: Joi.boolean(),
  recoverableDays: Joi.number().integer().positive().allow(0),
  recoveryLevel: Joi.string()
})

module.exports = AttributesModel
