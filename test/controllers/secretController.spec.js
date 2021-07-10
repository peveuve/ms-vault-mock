const { assert } = require('chai')
const sinon = require('sinon')
const secretController = require('../../lib/controllers/secretController')
const KeyVaultError = require('../../lib/domain/KeyVaultError')
const VaultFileClient = require('../../lib/persistence/VaultFileClient')

describe('secretController', function () {
  let vaultFileClient
  let vaultStub
  let res
  before(function () {
    vaultStub = {
      getSecrets: sinon.stub(),
      getSecret: sinon.stub(),
      setSecret: sinon.stub(),
      updateSecretVersion: sinon.stub(),
      deleteSecret: sinon.stub()
    }
    vaultFileClient = VaultFileClient.getInstance()
    sinon.stub(vaultFileClient, 'getVault').returns(vaultStub)
    res = {
      json: sinon.stub()
    }
  })
  after(function () {
    vaultFileClient.getVault.restore()
    VaultFileClient.instance = undefined
  })
  afterEach(function () {
    vaultFileClient.getVault.resetHistory()
    res.json.resetHistory()
  })

  describe('getSecrets', function () {
    afterEach(function () {
      vaultStub.getSecrets.resetHistory()
    })

    it('should return the list of secrets from the vault', function () {
      // Given
      const req = {
        query: {
          'api-version': '1.6'
        }
      }
      const secrets = [
        {
          versions: [
            {
              value: 'value',
              attributes: {
                created: 1
              }
            }
          ]
        }
      ]
      vaultStub.getSecrets.returns(secrets)

      // When
      secretController.getSecrets(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.getSecrets.should.be.calledOnceWithExactly(25, 0)
      const expectedResponse = {
        value: [
          {
            attributes: { created: 1 }
          }
        ]
      }
      res.json.should.be.calledOnceWithExactly(expectedResponse)
    })

    it('should return a page of secrets with default values', function () {
      // Given
      const req = {
        protocol: 'https',
        hostname: 'hostname',
        query: {
          maxresults: '20',
          skiptoken: '10'
        }
      }
      const secrets = [
        {
          versions: [
            {
              value: 'value1',
              attributes: {
                created: 2
              }
            },
            {
              value: 'value2',
              attributes: {
                created: 1
              }
            }
          ]
        }
      ]
      secrets.nextIndex = 30
      vaultStub.getSecrets.returns(secrets)

      // When
      secretController.getSecrets(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.getSecrets.should.be.calledOnceWithExactly(20, 10)
      const expectedResponse = {
        value: [
          {
            attributes: { created: 2 }
          }
        ],
        nextLink: 'https://hostname/secrets?api-version=7.1&$skiptoken=30&maxresults=20'
      }
      res.json.should.be.calledOnceWithExactly(expectedResponse)
    })
  })

  describe('getSecret', function () {
    afterEach(function () {
      vaultStub.getSecret.resetHistory()
    })

    it('should return the secret if exists', function () {
      // Given
      const req = {
        params: {
          secretName: 'name'
        }
      }
      const secret = {
        versions: [
          {
            value: 'value',
            attributes: {
              created: 1
            }
          }
        ]
      }
      vaultStub.getSecret.returns(secret)

      // When
      secretController.getSecret(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.getSecret.should.be.calledOnceWithExactly('name')
      const expectedResponse = {
        value: 'value',
        attributes: {
          created: 1
        }
      }
      res.json.should.be.calledOnceWithExactly(expectedResponse)
    })

    it('should throw a 404 error if the secret does not exist', function () {
      // Given
      const req = {
        params: {
          secretName: 'name'
        }
      }
      vaultStub.getSecret.returns(undefined)

      // When
      try {
        secretController.getSecret(req, res)
        assert.fail('should throw an error if the secret does not exist')
      } catch (error) {
        // Then
        vaultFileClient.getVault.should.be.calledOnceWithExactly()
        vaultStub.getSecret.should.be.calledOnceWithExactly('name')
        error.should.be.instanceOf(KeyVaultError)
        error.code.should.equal(404)
        error.message.should.equal('secret not found')
      }
    })
  })

  describe('getSecretVersion', function () {
    afterEach(function () {
      vaultStub.getSecret.resetHistory()
    })

    it('should return the secret version if exists', function () {
      // Given
      const req = {
        params: {
          secretName: 'name',
          secretVersion: '1'
        }
      }
      const secret = {
        versions: [
          {
            id: '1',
            value: 'value',
            attributes: {
              created: 1
            }
          }
        ]
      }
      vaultStub.getSecret.returns(secret)

      // When
      secretController.getSecretVersion(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.getSecret.should.be.calledOnceWithExactly('name')
      const expectedResponse = {
        id: '1',
        value: 'value',
        attributes: {
          created: 1
        }
      }
      res.json.should.be.calledOnceWithExactly(expectedResponse)
    })

    it('should throw a 404 error if the secret does not exist', function () {
      // Given
      const req = {
        params: {
          secretName: 'name',
          secretVersion: '1'
        }
      }
      vaultStub.getSecret.returns(undefined)

      // When
      try {
        secretController.getSecretVersion(req, res)
      } catch (error) {
        // Then
        vaultFileClient.getVault.should.be.calledOnceWithExactly()
        vaultStub.getSecret.should.be.calledOnceWithExactly('name')
        error.should.be.instanceOf(KeyVaultError)
        error.code.should.equal(404)
        error.message.should.equal('secret not found')
      }
    })

    it('should throw a 404 error if the secret version does not exist', function () {
      // Given
      const req = {
        params: {
          secretName: 'name',
          secretVersion: '2'
        }
      }
      const secret = {
        versions: [
          {
            id: '1',
            value: 'value',
            attributes: {
              created: 1
            }
          }
        ]
      }
      vaultStub.getSecret.returns(secret)

      // When
      try {
        secretController.getSecretVersion(req, res)
      } catch (error) {
        // Then
        vaultFileClient.getVault.should.be.calledOnceWithExactly()
        vaultStub.getSecret.should.be.calledOnceWithExactly('name')
        error.should.be.instanceOf(KeyVaultError)
        error.code.should.equal(404)
        error.message.should.equal('secret not found')
      }
    })
  })

  describe('putSecret', function () {
    afterEach(function () {
      vaultStub.setSecret.resetHistory()
    })

    it('should set the new secret and return it', function () {
      // Given
      const req = {
        hostname: 'hostname',
        protocol: 'https',
        body: {
          id: 'id',
          value: 'value'
        },
        params: {
          secretName: 'name'
        }
      }
      const createdSecret = { id: 'id' }
      vaultStub.setSecret.returns(createdSecret)

      // When
      secretController.putSecret(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.setSecret.should.be.calledOnceWithExactly(
        'name', { id: 'id', value: 'value' }, 'https', 'hostname')
      res.json.should.be.calledOnceWithExactly(createdSecret)
    })
  })

  describe('patchSecretVersion', function () {
    afterEach(function () {
      vaultStub.updateSecretVersion.resetHistory()
    })

    it('should update the secret version and return it', function () {
      // Given
      const req = {
        params: {
          secretName: 'name',
          secretVersion: 'version'
        },
        body: {
          id: 'id',
          value: 'value'
        }
      }
      const updatedVersion = {
        id: 'id'
      }
      vaultStub.updateSecretVersion.returns(updatedVersion)

      // When
      secretController.patchSecretVersion(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.updateSecretVersion.should.be.calledOnceWithExactly('name', 'version', { id: 'id', value: 'value' })
      res.json.should.be.calledOnceWithExactly(updatedVersion)
    })
  })

  describe('deleteSecret', function () {
    afterEach(function () {
      vaultStub.deleteSecret.resetHistory()
    })

    it('should delete the secret in the vault', function () {
      // Given
      const req = {
        params: { secretName: 'name' }
      }
      const deletedSecret = { id: 'id' }
      vaultStub.deleteSecret.returns(deletedSecret)

      // When
      secretController.deleteSecret(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.deleteSecret.should.be.calledOnceWithExactly('name')
      res.json.should.be.calledOnceWithExactly(deletedSecret)
    })

    it('should throw an 404 error if the secret does not exist', function () {
      // Given
      const req = {
        params: { secretName: 'name' }
      }
      vaultStub.deleteSecret.returns(undefined)

      // When
      try {
        secretController.deleteSecret(req, res)
      } catch (error) {
        // Then
        vaultFileClient.getVault.should.be.calledOnceWithExactly()
        vaultStub.deleteSecret.should.be.calledOnceWithExactly('name')
        error.should.be.instanceOf(KeyVaultError)
        error.code.should.equal(404)
        error.message.should.equal('secret not found')
      }
    })
  })
})
