const express = require('express')
const { validate } = require('express-validation')
const SecretVersionModel = require('./models/SecretVersionModel')
const secretController = require('../controllers/secretController')

const secretRouter = express.Router()

secretRouter.get('/', secretController.getSecrets)

secretRouter.get('/:secretName', secretController.getSecret)

secretRouter.get('/:secretName/:secretVersion', secretController.getSecretVersion)

secretRouter.put('/:secretName', validate({ body: SecretVersionModel }), secretController.putSecret)

secretRouter.patch('/:secretName/:secretVersion', validate({ body: SecretVersionModel }), secretController.patchSecretVersion)

secretRouter.delete('/:secretName', secretController.deleteSecret)

module.exports = secretRouter
