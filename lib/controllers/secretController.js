const VaultFileClient = require('../persistence/VaultFileClient')
const KeyVaultError = require('../domain/KeyVaultError')

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

module.exports.getSecrets = (req, res) => {
  const maxResults = Number.parseInt(req.query.maxresults) || 25
  const nextIndex = Number.parseInt(req.query.skiptoken) || 0
  const vault = VaultFileClient.getInstance().getVault()
  const secrets = vault.getSecrets(maxResults, nextIndex)
  const paginatedSecrets = {}
  paginatedSecrets.value = secrets.map(secret => findLastVersion(secret))
  paginatedSecrets.value.forEach((version) => { delete version.value })
  if (secrets.nextIndex) {
    const apiVersion = req.query['api-version'] || '7.1'
    paginatedSecrets.nextLink = `${req.protocol}://${req.hostname}/secrets?api-version=${apiVersion}&$skiptoken=${secrets.nextIndex}&maxresults=${maxResults}`
  }
  res.json(paginatedSecrets)
}

module.exports.getSecret = (req, res) => {
  const vault = VaultFileClient.getInstance().getVault()
  const secretFound = vault.getSecret(req.params.secretName)
  if (secretFound) {
    return res.json(findLastVersion(secretFound))
  }
  throw new KeyVaultError(404, 'secret not found')
}

module.exports.getSecretVersion = (req, res) => {
  const vault = VaultFileClient.getInstance().getVault()
  const secretFound = vault.getSecret(req.params.secretName)
  if (secretFound) {
    const versionFound = secretFound.versions.find(version => version.id.endsWith(req.params.secretVersion))
    if (versionFound) {
      return res.json(versionFound)
    }
  }
  throw new KeyVaultError(404, 'secret not found')
}

module.exports.putSecret = (req, res) => {
  const secretToCreate = { ...req.body }
  const secretName = req.params.secretName
  const vault = VaultFileClient.getInstance().getVault()
  const createdSecret = vault.setSecret(secretName, secretToCreate, req.protocol, req.hostname)
  res.json(createdSecret)
}

module.exports.patchSecretVersion = (req, res) => {
  const secretName = req.params.secretName
  const secretVersion = req.params.secretVersion
  const versionUpdate = req.body
  const vault = VaultFileClient.getInstance().getVault()
  const updatedVersion = vault.updateSecretVersion(secretName, secretVersion, versionUpdate)
  res.json(updatedVersion)
}

module.exports.deleteSecret = (req, res) => {
  const secretName = req.params.secretName
  const vault = VaultFileClient.getInstance().getVault()
  const deletedSecret = vault.deleteSecret(secretName)
  if (deletedSecret) {
    res.json(deletedSecret)
  } else {
    throw new KeyVaultError(404, 'secret not found')
  }
}
