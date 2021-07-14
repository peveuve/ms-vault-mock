const sinon = require('sinon')
const keyController = require('../../lib/controllers/keyController')
const VaultFileClient = require('../../lib/persistence/VaultFileClient')

describe('keyController', function () {
  let vaultFileClient
  let vaultStub
  let res
  before(function () {
    vaultStub = {
      getKeys: sinon.stub()
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

  describe('getKeys', function () {
    afterEach(function () {
      vaultStub.getKeys.resetHistory()
    })

    it('should return the list of keys from the vault', function () {
      // Given
      const req = {
        query: {
          'api-version': '1.6'
        }
      }
      const keys = [
        {
          name: 'name1',
          versions: [
            {
              id: 'id1',
              key: 'pem1',
              operations: [],
              attributes: { created: 1 },
              tags: { tag1: 'value1' }
            }
          ]
        }
      ]
      vaultStub.getKeys.returns(keys)

      // When
      keyController.getKeys(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.getKeys.should.be.calledOnceWithExactly(25, 0)
      const expectedResponse = {
        value: [
          {
            kid: 'id1',
            attributes: { created: 1 },
            tags: { tag1: 'value1' }
          }
        ]
      }
      res.json.should.be.calledOnceWithExactly(expectedResponse)
    })

    it('should return a page of keys with default values', function () {
      // Given
      const req = {
        protocol: 'https',
        hostname: 'hostname',
        query: {
          maxresults: '20',
          skiptoken: '10'
        }
      }
      const keys = [
        {
          name: 'name1',
          versions: [
            {
              id: 'id1',
              attributes: {
                created: 1
              }
            },
            {
              id: 'id2',
              attributes: {
                created: 2
              }
            }
          ]
        }
      ]
      keys.nextIndex = 30
      vaultStub.getKeys.returns(keys)

      // When
      keyController.getKeys(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.getKeys.should.be.calledOnceWithExactly(20, 10)
      const expectedResponse = {
        value: [
          {
            kid: 'id2',
            attributes: { created: 2 },
            tags: undefined
          }
        ],
        nextLink: 'https://hostname/keys?api-version=7.1&$skiptoken=30&maxresults=20'
      }
      res.json.should.be.calledOnceWithExactly(expectedResponse)
    })
  })
})
