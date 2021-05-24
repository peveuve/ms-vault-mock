const should = require('chai').should()
const { assert } = require('chai')
const sinon = require('sinon')
const KeyVaultError = require('../../lib/domain/KeyVaultError')
const Vault = require('../../lib/domain/Vault')
const vaultSecrets = require('./vault.json')

describe('Vault', function () {
  describe('getSecrets', function () {
    it('should return a deep clone of all the secrets from the vault', function () {
      // Given
      const vault = new Vault(vaultSecrets)

      // When
      const secrets = vault.getSecrets()

      // Then
      secrets.length.should.equal(vaultSecrets.length)
      secrets.should.not.equal(vaultSecrets)
      secrets[0].should.not.equal(vaultSecrets[0])
      secrets[1].should.not.equal(vaultSecrets[1])
      secrets.should.deep.equal(vaultSecrets)
    })

    it('should return a deep clone of a part of the secrets from the vault', function () {
      // Given
      const vault = new Vault(vaultSecrets)

      // When
      const secrets = vault.getSecrets(1)

      // Then
      secrets.length.should.equal(1)
      secrets.should.not.equal(vaultSecrets)
      secrets[0].should.not.equal(vaultSecrets[0])
      secrets.should.deep.equal(vaultSecrets.slice(0, 1))
      secrets.nextIndex.should.equal(1)
    })

    it('should return a deep clone of a part of the secrets from the vault starting from the given index', function () {
      // Given
      const vault = new Vault(vaultSecrets)

      // When
      const secrets = vault.getSecrets(1, 1)

      // Then
      secrets.length.should.equal(1)
      secrets.should.not.equal(vaultSecrets)
      secrets[0].should.not.equal(vaultSecrets[1])
      secrets.should.deep.equal(vaultSecrets.slice(1, 2))
      should.not.exist(secrets.nextIndex)
    })
  })

  describe('getSecret', function () {
    it('should return a deep clone secret from the vault', function () {
      // Given
      const vault = new Vault(vaultSecrets)

      // When
      const secret = vault.getSecret('secret1')

      // Then
      secret.should.not.equal(vaultSecrets[0])
      secret.should.deep.equal(vaultSecrets[0])
    })

    it('should return undefined if the secret does not exist', function () {
      // Given
      const vault = new Vault(vaultSecrets)

      // When
      const secret = vault.getSecret('xxxx')

      // Then
      should.not.exist(secret)
    })
  })

  describe('deleteSecret', function () {
    before(function () {
      sinon.stub(Date, 'now')
    })
    after(function () {
      Date.now.restore()
    })
    afterEach(function () {
      Date.now.resetHistory()
    })

    it('should delete a secret from the vault and notify the listeners', function () {
      // Given
      Date.now.returns(11111111111)
      const vault = new Vault(JSON.parse(JSON.stringify(vaultSecrets)))
      vault.on('changed', (changedVault) => {
        // Then
        changedVault.getSecrets().should.deep.equal([{
          name: 'secret2',
          versions: [
            {
              id: 'id2',
              value: 'value2',
              attributes: {
                enabled: false,
                created: 1619366691188,
                updated: 1619366691188
              }
            }
          ]
        }])
      })

      // When
      const deletedSecret = vault.deleteSecret('secret1', 'http', 'hostname')

      // Then
      deletedSecret.should.deep.equal({
        id: 'id1',
        value: 'value1',
        deletedDate: 11111111111,
        scheduledPurgeDate: 11111111111 + 1000 * 60 * 60 * 24,
        recoveryId: 'http://hostname/deletedsecrets/secret1',
        attributes: {
          enabled: true,
          created: 1619366691187,
          updated: 1619366691187
        }
      })
    })

    it('should do nothing if the secret does not exist', function () {
      // Given
      const vault = new Vault(JSON.parse(JSON.stringify(vaultSecrets)))
      vault.on('changed', (changedVault) => {
        // Then
        assert.fail('changed event should not be emitted')
      })

      // When
      const deletedSecret = vault.deleteSecret('xxxx')

      // Then
      should.not.exist(deletedSecret)
    })
  })

  describe('setSecret', function () {
    let sandbox
    before(function () {
      sandbox = sinon.createSandbox()
      sandbox.stub(Date, 'now')
    })
    after(function () {
      sandbox.restore()
    })
    afterEach(function () {
      sandbox.resetHistory()
    })

    it('should add a new secret if it does not exist and notify the listener', function () {
      // Given
      Date.now.returns(11111111111)
      const newSecret = {
        value: 'value3'
      }
      const expectedSecret = {
        value: 'value3',
        attributes: {
          created: 11111111111,
          updated: 11111111111
        }
      }
      const vault = new Vault(JSON.parse(JSON.stringify(vaultSecrets)))
      vault.on('changed', (changedVault) => {
        // Then
        const lastSecret = changedVault.getSecrets()[2]
        lastSecret.name.should.equal('secret3')
        lastSecret.versions.length.should.equal(1)
        lastSecret.versions[0].should.deep.include(expectedSecret)
      })

      // When
      const createdSecret = vault.setSecret('secret3', newSecret, 'http', 'hostname')

      // Then
      createdSecret.should.deep.include(expectedSecret)
    })

    it('should add a new version to an existing secret and notify the listener', function () {
      // Given
      Date.now.returns(11111111111)
      const newSecret = {
        value: 'value11',
        attributes: {
          enabled: true
        }
      }
      const expectedSecret = {
        value: 'value11',
        attributes: {
          enabled: true,
          created: 11111111111,
          updated: 11111111111
        }
      }
      const vault = new Vault(JSON.parse(JSON.stringify(vaultSecrets)))
      vault.on('changed', (changedVault) => {
        // Then
        const lastSecret = changedVault.getSecrets()[0]
        lastSecret.name.should.equal('secret1')
        lastSecret.versions.length.should.equal(2)
        lastSecret.versions[1].should.deep.include(expectedSecret)
      })

      // When
      const createdSecret = vault.setSecret('secret1', newSecret, 'http', 'hostname')

      // Then
      createdSecret.should.deep.include(expectedSecret)
    })
  })

  describe('updateSecretVersion', function () {
    it('should modify the version of an existing secret', function () {
      // Given
      const newVersion = {
        attributes: {
          enabled: false
        }
      }
      const vault = new Vault(JSON.parse(JSON.stringify(vaultSecrets)))

      // When
      const finalVersion = vault.updateSecretVersion('secret1', '1', newVersion)

      // Then
      finalVersion.should.deep.equal({
        id: 'id1',
        value: 'value1',
        attributes: {
          enabled: false,
          created: 1619366691187,
          updated: 1619366691187
        }
      })
    })

    it('should throw an error if the secret does not exist', function () {
      // Given
      const newVersion = {
        attributes: {
          enabled: false
        }
      }
      const vault = new Vault(vaultSecrets)

      // When
      try {
        vault.updateSecretVersion('secretN', '1', newVersion)
        assert.fail('should throw an error if the secret does not exist')
      } catch (error) {
        // Then
        error.should.be.instanceOf(KeyVaultError)
      }
    })

    it('should throw an error if the secret version does not exist', function () {
      // Given
      const newVersion = {
        attributes: {
          enabled: false
        }
      }
      const vault = new Vault(vaultSecrets)

      // When
      try {
        vault.updateSecretVersion('secret1', 'N', newVersion)
        assert.fail('should throw an error if the secret version does not exist')
      } catch (error) {
        // Then
        error.should.be.instanceOf(KeyVaultError)
      }
    })
  })

  describe('setSecrets', function () {
    it('should create or update the secrets', function () {
      // Given
      const newSecrets = {
        secret1: 'value11',
        secret2: 'value2',
        secret3: 'value3'
      }
      const vault = new Vault(JSON.parse(JSON.stringify(vaultSecrets)))

      // When
      vault.setSecrets(newSecrets)

      // Then
      const newVaultSecrets = vault.getSecrets()
      newVaultSecrets.should.have.lengthOf(3)
      newVaultSecrets[0].versions.should.have.lengthOf(2)
      newVaultSecrets[0].versions[0].value.should.equal('value1')
      newVaultSecrets[0].versions[1].value.should.equal('value11')
      newVaultSecrets[1].name.should.equal('secret2')
      newVaultSecrets[1].versions.should.have.lengthOf(1)
      newVaultSecrets[1].versions[0].value.should.equal('value2')
      newVaultSecrets[2].name.should.equal('secret3')
      newVaultSecrets[2].versions.should.have.lengthOf(1)
      newVaultSecrets[2].versions[0].value.should.equal('value3')
    })
  })
})
