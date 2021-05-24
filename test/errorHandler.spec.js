const sinon = require('sinon')
const { ValidationError } = require('express-validation')
const errorHandler = require('../lib/errorHandler')
const KeyVaultError = require('../lib/domain/KeyVaultError')

describe('errorHandler', function () {
  describe('handleError', function () {
    let res
    before(function () {
      res = {
        status: sinon.stub().callsFake(() => res),
        json: sinon.stub().callsFake(() => res)
      }
    })
    afterEach(function () {
      res.status.resetHistory()
      res.json.resetHistory()
    })

    it('should handle a ValidationError', function () {
      // Given
      const validationError = new ValidationError(null, { statusCode: 400, error: 'error' })
      const req = {}
      const next = () => {}

      // When
      errorHandler.handleError(validationError, req, res, next)

      // Then
      res.status.should.be.calledOnceWithExactly(400)
      res.json.should.be.calledOnceWithExactly(validationError)
    })

    it('should handle a KeyVaultError', function () {
      // Given
      const innerError = new Error('inner')
      const keyVaultError = new KeyVaultError(400, 'message', innerError)
      const req = {}
      const next = () => {}

      // When
      errorHandler.handleError(keyVaultError, req, res, next)

      // Then
      res.status.should.be.calledOnceWithExactly(500)
      res.json.should.be.calledOnceWithExactly({
        error: {
          code: 400,
          message: 'message',
          innererror: innerError
        }
      })
    })

    it('should handle a random Error', function () {
      // Given
      const anError = new Error('message')
      const req = {}
      const next = () => {}

      // When
      errorHandler.handleError(anError, req, res, next)

      // Then
      res.status.should.be.calledOnceWithExactly(500)
      res.json.should.be.calledOnceWithExactly({
        error: {
          code: 500,
          message: 'message'
        }
      })
    })
  })
})
