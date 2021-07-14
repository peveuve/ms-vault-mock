
class VaultItem {
  static findLastVersion (item) {
    return item.versions.reduce((candidateVersion, currentVersion) => {
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
}

module.exports = VaultItem
