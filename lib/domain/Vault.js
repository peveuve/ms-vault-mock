const EventEmitter = require('events')
const uuid = require('uuid')
const cloneDeep = require('lodash.clonedeep')
const merge = require('lodash.merge')
const KeyVaultError = require('../domain/KeyVaultError')

class Vault extends EventEmitter {
  constructor (secrets) {
    super()
    this.secrets = secrets || []
  }

  createSecretId (secretName, protocol, hostname) {
    const secretVersion = uuid.v4()
    return `${protocol}://${hostname}/secrets/${secretName}/${secretVersion}`
  }

  getSecrets (quantity = 25, startIndex = 0) {
    const secretsFound = this.secrets.slice(startIndex, startIndex + quantity)
    const clonedSecrets = cloneDeep(secretsFound)
    if (startIndex + quantity < this.secrets.length) {
      clonedSecrets.nextIndex = startIndex + quantity
    }
    return clonedSecrets
  }

  getSecret (secretName) {
    const secretFound = this.secrets.find(secret => secret.name === secretName)
    if (secretFound) {
      return cloneDeep(secretFound)
    }
  }

  deleteSecret (secretName, protocol, hostname) {
    const secretToRemoveIndex = this.secrets.findIndex((secret) => secret.name === secretName)
    if (secretToRemoveIndex > -1) {
      const deletedSecrets = this.secrets.splice(secretToRemoveIndex, 1)
      this.emit('changed', this)
      const deletedSecret = deletedSecrets[0]
      const deletedSecretLastVersion = deletedSecret.versions.pop()
      deletedSecretLastVersion.recoveryId = `${protocol}://${hostname}/deletedsecrets/${secretName}`
      deletedSecretLastVersion.deletedDate = Date.now()
      deletedSecretLastVersion.scheduledPurgeDate = Date.now() + 1000 * 60 * 60 * 24
      return deletedSecretLastVersion
    }
  }

  /**
   * Creates or updates a secret.
   * @param {string} secretName name of the secret to create or update
   * @param {Object} newVersion version of the secret
   * @param {string} protocol used to build the secret id
   * @param {string} hostname used to build the secret id
   * @returns {Object} the secret version created or updated
   */
  setSecret (secretName, newVersion, protocol, hostname) {
    if (!newVersion.attributes) {
      newVersion.attributes = {}
    }
    const createdTime = Date.now()
    newVersion.attributes.created = createdTime
    newVersion.attributes.updated = createdTime
    newVersion.id = this.createSecretId(secretName, protocol, hostname)
    let secretFound = this.secrets.find(secret => secret.name === secretName)
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

  setSecrets (newSecrets) {
    Object.keys(newSecrets).forEach(newSecretName => {
      let secretFound = this.secrets.find(secret => secret.name === newSecretName)
      if (!secretFound) {
        secretFound = {
          name: newSecretName,
          versions: []
        }
        this.secrets.push(secretFound)
      }
      const versionFound = secretFound.versions.find(version => version.value === newSecrets[newSecretName])
      if (!versionFound) {
        const createdTime = Date.now()
        const newVersion = {
          id: this.createSecretId(newSecretName, 'https', 'localhost'),
          value: newSecrets[newSecretName],
          attributes: {
            enabled: true,
            created: createdTime,
            updated: createdTime
          }
        }
        secretFound.versions.push(newVersion)
      }
    })
    this.emit('changed', this)
  }

  updateSecretVersion (secretName, secretVersion, versionUpdate) {
    const secretFound = this.secrets.find(secret => secret.name === secretName)
    if (secretFound) {
      const secretVersionFound = secretFound.versions.find(version => version.id.endsWith(secretVersion))
      if (secretVersionFound) {
        merge(secretVersionFound, versionUpdate)
        this.emit('changed', this)
        return secretVersionFound
      }
    }
    throw new KeyVaultError(404, 'secret not found')
  }
}

module.exports = Vault
