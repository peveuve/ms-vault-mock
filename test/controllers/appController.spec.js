const sinon = require('sinon')
const appController = require('../../lib/controllers/appController')
const VaultFileClient = require('../../lib/persistence/VaultFileClient')

describe('appController', function () {
  let vaultFileClient
  let vaultStub
  let res
  before(function () {
    vaultStub = {
      getSecrets: sinon.stub()
    }
    vaultFileClient = VaultFileClient.getInstance()
    sinon.stub(vaultFileClient, 'getVault').returns(vaultStub)
    res = {
      render: sinon.stub()
    }
  })
  after(function () {
    vaultFileClient.getVault.restore()
    VaultFileClient.instance = undefined
  })
  afterEach(function () {
    vaultFileClient.getVault.resetHistory()
    res.render.resetHistory()
  })

  describe('getRoot', function () {
    afterEach(function () {
      vaultStub.getSecrets.resetHistory()
    })

    it('sould return the root page with the secrets in the response', function () {
      // Given
      const req = {}
      const secrets = [
        {
          name: 'name',
          versions: [
            {
              id: 'id',
              value: 'value'
            }
          ]
        }
      ]
      vaultStub.getSecrets.returns(secrets)

      // When
      appController.getRoot(req, res)

      // Then
      vaultFileClient.getVault.should.be.calledOnceWithExactly()
      vaultStub.getSecrets.should.be.calledOnceWithExactly()
      res.render.should.be.calledOnceWithExactly('index', { secrets })
    })
  })
})
