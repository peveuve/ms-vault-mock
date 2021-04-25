require('chai').should()
const Vault = require('../../lib/domain/Vault')

describe('Vault', function () {
  describe('getSecrets', function () {
    it('should return the secrets', function () {
      // Given
      const vault = new Vault()

      // When
      const secrets = vault.getSecrets()

      // Then
      secrets.should.deep.equal([])
    })
  })
})
