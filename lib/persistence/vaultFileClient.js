const fs = require('fs')
const Vault = require('../domain/Vault')

class VaultFileClient {
  static instance = null

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
    const stringLoaded = fs.readFileSync(this.filePath, this.encoding)
    const secrets = JSON.parse(stringLoaded)
    const vault = new Vault(secrets)
    console.log(`vault ${this.filePath} loaded`)
    return vault
  }

  /**
   * Saves a vault in the file.
   * @param {Vault} vault the vault to save
   */
  save (vault) {
    const secrets = vault.getSecrets()
    const stringToSave = JSON.stringify(secrets)
    fs.writeFileSync(this.filePath, stringToSave, this.encoding)
    console.log(`vault ${this.filePath} saved`)
  }
}

module.exports = VaultFileClient
