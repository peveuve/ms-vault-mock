const fs = require('fs')
const Vault = require('../domain/Vault')

class VaultFileClient {
  constructor (filePath, encoding) {
    this.filePath = filePath
    this.encoding = encoding
  }

  /**
   * Returns the unique instance of vault file client.
   * @param {string} filePath path to the vault file
   * @param {string} encoding encoding of the vault file
   * @returns {VaultFileClient} the vault file client
   */
  static getInstance (filePath, encoding) {
    if (!VaultFileClient.instance) {
      VaultFileClient.instance = new VaultFileClient(filePath, encoding)
    }
    return VaultFileClient.instance
  }

  /**
   *
   * @returns {Vault} the vault
   */
  getVault () {
    if (!this.vault) {
      if (fs.existsSync(this.filePath)) {
        this.vault = this.load()
      } else {
        this.vault = new Vault()
      }
      this.vault.on('changed', (vault) => {
        this.save(vault)
      })
    }
    return this.vault
  }

  /**
   * Loads a vault from the file.
   * @returns {Vault} the loaded vault
   */
  load () {
    const stringifiedVault = fs.readFileSync(this.filePath, this.encoding)
    const parsedVault = JSON.parse(stringifiedVault)
    const vault = new Vault(parsedVault)
    console.log(`vault ${this.filePath} loaded`)
    return vault
  }

  /**
   * Saves a vault in the file.
   * @param {Vault} vault the vault to save
   */
  save (vault) {
    const stringifiedVault = JSON.stringify(vault, function (key, value) {
      if (key === '_events' || key === '_eventsCount') {
        return undefined
      }
      return value
    }, 2)
    fs.writeFileSync(this.filePath, stringifiedVault, this.encoding)
    console.log(`vault ${this.filePath} saved`)
  }
}

module.exports = VaultFileClient
