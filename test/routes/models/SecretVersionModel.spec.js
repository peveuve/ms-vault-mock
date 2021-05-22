const { expect } = require('chai')
const SecretVersionModel = require('../../../lib/routes/models/SecretVersionModel')

describe('SecretVersionModel', function () {
  it('should accept a valid secret version', function () {
    const secretVersionToValidate = {
      id: 'uhfgiduhg-fgjfgf-fgfg',
      value: 'value',
      contentType: 'text/plain',
      tags: {},
      attributes: {
        created: 5468768454,
        updated: 8765455478,
        exp: 546545454,
        nbf: 846845464,
        enabled: true,
        recoverableDays: 7,
        recoveryLevel: 'level'
      }
    }
    const result = SecretVersionModel.validate(secretVersionToValidate)
    expect(result.error).to.not.exist()
  })
  it('should reject an invalid secret version', function () {
    const secretVersionToValidate = {
      id: 545454,
      value: 78,
      contentType: 87,
      tags: '',
      attributes: 54
    }
    const result = SecretVersionModel.validate(secretVersionToValidate)
    expect(result.error).to.exist()
  })
})
