const express = require('express')
const VaultFileClient = require('../persistence/VaultFileClient')

const appRouter = express.Router()

appRouter.get('/', function (req, res) {
  const secrets = VaultFileClient.getInstance().getVault().getSecrets()
  res.render('index', { secrets })
})

module.exports = appRouter
