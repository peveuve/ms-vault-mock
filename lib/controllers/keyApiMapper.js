const VaultItem = require('../domain/VaultItem')

module.exports.mapKeyToApi = (keyToMap) => {
  const versionToMap = VaultItem.findLastVersion(keyToMap)
  return {
    kid: versionToMap.id,
    attributes: versionToMap.attributes,
    tags: versionToMap.tags
  }
}
