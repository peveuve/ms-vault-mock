const Joi = require('joi')
const AttributesModel = require('./AttributesModel')

const SecretVersionModel = Joi.object().keys({
  value: Joi.string(),
  id: Joi.string(),
  contentType: Joi.string(),
  tags: Joi.object(),
  attributes: AttributesModel
})

module.exports = SecretVersionModel
