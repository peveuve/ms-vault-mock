const { ValidationError } = require('express-validation')
const KeyVaultError = require('./domain/KeyVaultError')

module.exports.handleError = (error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json(error)
  } else if (error instanceof KeyVaultError) {
    const responseBody = {
      error: {
        code: error.code,
        message: error.message,
        innererror: error.innererror
      }
    }
    res.status(500).json(responseBody)
  } else {
    const responseBody = {
      error: {
        code: 500,
        message: error.message
      }
    }
    res.status(500).json(responseBody)
  }
}
