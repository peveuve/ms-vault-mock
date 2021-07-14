const express = require('express')
const keyController = require('../controllers/keyController')

const keyRouter = express.Router()

keyRouter.get('/', keyController.getKeys)

module.exports = keyRouter
