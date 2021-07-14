const VaultFileClient = require('../persistence/VaultFileClient')
const keyApiMapper = require('./keyApiMapper')

module.exports.getKeys = (req, res) => {
  const maxResults = Number.parseInt(req.query.maxresults) || 25
  const nextIndex = Number.parseInt(req.query.skiptoken) || 0
  const vault = VaultFileClient.getInstance().getVault()
  const keys = vault.getKeys(maxResults, nextIndex)
  const paginatedKeys = {}
  paginatedKeys.value = keys.map(keyApiMapper.mapKeyToApi)
  if (keys.nextIndex) {
    const apiVersion = req.query['api-version'] || '7.1'
    paginatedKeys.nextLink = `${req.protocol}://${req.hostname}/keys?api-version=${apiVersion}&$skiptoken=${keys.nextIndex}&maxresults=${maxResults}`
  }
  res.json(paginatedKeys)
}
