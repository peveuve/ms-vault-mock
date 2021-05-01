const Joi = require('joi')
const SecretVersionAttributesModel = require('./SecretVersionAttributesModel')

const SecretVersionModel = Joi.object().keys({
  value: Joi.string(),
  id: Joi.string(),
  contentType: Joi.string(),
  tags: Joi.object(),
  attributes: SecretVersionAttributesModel
})

module.exports = SecretVersionModel
