const express = require('express')
const appController = require('../controllers/appController')

const appRouter = express.Router()

appRouter.get('/', appController.getRoot)

module.exports = appRouter
