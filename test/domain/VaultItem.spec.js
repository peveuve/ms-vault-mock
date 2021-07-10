const VaultItem = require('../../lib/domain/VaultItem')

describe('VaultItem', function () {
  describe('findLastVersion', function () {
    it('should return the most recent version', function () {
      // Given
      const vaultItem = {
        versions: [
          {
            attributes: { created: 11111 }
          },
          {
            attributes: { created: 33333 }
          },
          {
            attributes: { created: 22222 }
          }
        ]
      }

      // When
      const lastVersion = VaultItem.findLastVersion(vaultItem)

      // Then
      lastVersion.should.deep.equal({
        attributes: { created: 33333 }
      })
    })
  })
})
