const express = require('express')
const VaultFileClient = require('../persistence/vaultFileClient')

const secretRouter = express.Router()

function findLastVersion (secret) {
  return secret.versions.reduce((candidateVersion, currentVersion) => {
    if (currentVersion.attributes.created > candidateVersion.attributes.created) {
      return currentVersion
    }
    return candidateVersion
  }, {
    attributes: {
      created: 0
    }
  })
}

secretRouter.get('/', (req, res) => {
  const apiVersion = Number.parseFloat(req.query['api-version']) || 7.1
  const maxResults = Number.parseInt(req.query.maxresults) || 25
  const vault = VaultFileClient.getInstance().getVault()
  const secrets = vault.getSecrets(maxResults)
  const paginatedSecrets = {}
  paginatedSecrets.value = secrets.map(secret => findLastVersion(secret))
  if (secrets.length === maxResults) {
    paginatedSecrets.nextLink = `${req.protocol}://${req.hostname}/secrets?api-version=${apiVersion}&$skiptoken=xxxxxxx&maxresults=${maxResults}`
  }
  res.json(paginatedSecrets)
})

secretRouter.get('/:secretName', (req, res) => {
  const vault = VaultFileClient.getInstance().getVault()
  const secretFound = vault.getSecret(req.params.secretName)
  if (secretFound) {
    return res.json(findLastVersion(secretFound))
  }
  const errorNotFound = {
    error: {
      code: 404,
      message: 'Secret not found'
    }
  }
  res.status(404).json(errorNotFound)
})

secretRouter.get('/:secretName/:secretVersion', (req, res) => {
  const vault = VaultFileClient.getInstance().getVault()
  const secretFound = vault.getSecret(req.params.secretName)
  if (secretFound) {
    const versionFound = secretFound.versions.find(version => version.id.endsWith(req.params.secretVersion))
    if (versionFound) {
      return res.json(secretFound)
    }
  }
  const errorNotFound = {
    error: {
      code: 404,
      message: 'Secret not found'
    }
  }
  res.status(404).json(errorNotFound)
})

secretRouter.put('/:secretName', (req, res) => {
  const secretToCreate = { ...req.body }
  const secretName = req.params.secretName
  const vault = VaultFileClient.getInstance().getVault()
  const createdSecret = vault.setSecret(secretName, secretToCreate, req.protocol, req.hostname)
  res.json(createdSecret)
})

module.exports = secretRouter
