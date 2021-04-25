const EventEmitter = require('events')
const uuid = require('uuid')

class Vault extends EventEmitter {
  constructor (secrets) {
    super()
    this.secrets = secrets || []
  }

  createSecretId (secretName, secretVersion, protocol, hostname) {
    return `${protocol}://${hostname}/secrets/${secretName}/${secretVersion}`
  }

  getSecrets (quantity) {
    return this.secrets.slice(0, quantity)
  }

  getSecret (secretName) {
    return this.secrets.find(secret => secret.name === secretName)
  }

  /**
   *
   * @param {string} secretName
   * @param {Object} newVersion
   * @param {string} protocol
   * @param {string} hostname
   * @returns {Object}
   */
  setSecret (secretName, newVersion, protocol, hostname) {
    if (!newVersion.attributes) {
      newVersion.attributes = {}
    }
    const createdTime = Date.now()
    newVersion.attributes.created = createdTime
    newVersion.attributes.updated = createdTime
    const secretVersion = uuid.v4()
    newVersion.id = this.createSecretId(secretName, secretVersion, protocol, hostname)
    let secretFound = this.getSecret(secretName)
    if (!secretFound) {
      secretFound = {
        name: secretName,
        versions: []
      }
      this.secrets.push(secretFound)
    }
    secretFound.versions.push(newVersion)

    this.emit('changed', this)

    return newVersion
  }
}

module.exports = Vault
