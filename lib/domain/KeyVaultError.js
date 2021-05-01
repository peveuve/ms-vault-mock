class KeyVaultError extends Error {
  constructor (code, message, error) {
    super(message)
    this.code = code
    this.message = message
    this.innererror = error
  }
}

module.exports = KeyVaultError
