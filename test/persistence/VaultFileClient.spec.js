const sinon = require('sinon')
const chai = require('chai')
chai.use(require('sinon-chai'))
chai.use(require('dirty-chai'))
const fs = require('fs')
const Vault = require('../../lib/domain/Vault')
const vaultContent = require('../domain/vault.json')
const VaultFileClient = require('../../lib/persistence/VaultFileClient')

describe('VaultFileClient', function () {
  const filePath = 'path/vault'
  const fileEncoding = 'utf8'
  describe('getInstance', function () {
    it('should return the same instance when called twice', function () {
      // When
      const vaultClient = VaultFileClient.getInstance(filePath, fileEncoding)
      const vaultClient2 = VaultFileClient.getInstance()

      // Then
      vaultClient.should.exist()
      vaultClient2.should.exist()
      vaultClient.should.equal(vaultClient2)
    })
  })

  describe('load', function () {
    before(function () {
      sinon.stub(fs, 'readFileSync')
    })
    after(function () {
      fs.readFileSync.restore()
    })
    it('should load the vault from the file', function () {
      // Given
      fs.readFileSync.returns(JSON.stringify(vaultContent))
      const vaultClient = VaultFileClient.getInstance()

      // When
      const vault = vaultClient.load()

      // Then
      fs.readFileSync.should.be.calledOnceWithExactly(filePath, fileEncoding)
      vault.should.be.instanceOf(Vault)
      vault.getSecrets().should.deep.equal(vaultContent.secrets)
      vault.getKeys().should.deep.equal(vaultContent.keys)
    })
  })

  describe('save', function () {
    before(function () {
      sinon.stub(fs, 'writeFileSync')
    })
    after(function () {
      fs.writeFileSync.restore()
    })
    it('should save the vault in the file', function () {
      // Given
      fs.writeFileSync.returns()
      const vaultToSave = new Vault(vaultContent)
      const vaultClient = VaultFileClient.getInstance()

      // When
      vaultClient.save(vaultToSave)

      // Then
      fs.writeFileSync.should.be.calledOnceWithExactly(filePath, JSON.stringify(vaultContent, null, 2), fileEncoding)
    })
  })

  describe('getVault', function () {
    let sandbox
    before(function () {
      sandbox = sinon.createSandbox()
      sandbox.stub(fs, 'readFileSync')
      sandbox.stub(fs, 'writeFileSync')
      sandbox.stub(fs, 'existsSync')
    })
    after(function () {
      sandbox.restore()
    })
    afterEach(function () {
      sandbox.resetHistory()
    })
    it('should return the vault if the file exists', function () {
      // Given
      fs.existsSync.returns(true)
      fs.readFileSync.returns(JSON.stringify(vaultContent))
      const vaultClient = VaultFileClient.getInstance()

      // When
      const vault = vaultClient.getVault()

      // Then
      fs.existsSync.should.be.calledOnceWithExactly(filePath)
      fs.readFileSync.should.be.calledOnce()
      vault.should.be.instanceOf(Vault)
      vault.getSecrets().should.have.lengthOf(2)
      vault.getKeys().should.have.lengthOf(2)
    })

    it('should return an empty vault if the file does not exist', function () {
      // Given
      fs.existsSync.returns(false)
      const vaultClient = VaultFileClient.getInstance()
      vaultClient.vault = undefined

      // When
      const vault = vaultClient.getVault()

      // Then
      fs.existsSync.should.be.calledOnceWithExactly(filePath)
      fs.readFileSync.should.not.be.called()
      vault.should.be.instanceOf(Vault)
      vault.getSecrets().should.have.lengthOf(0)
      vault.getKeys().should.have.lengthOf(0)
    })

    it('should return the preloaded vault', function () {
      // Given
      const vaultClient = VaultFileClient.getInstance()

      // When
      const vault = vaultClient.getVault()

      // Then
      fs.existsSync.should.not.be.called()
      fs.readFileSync.should.not.be.called()
      vault.should.be.instanceOf(Vault)
      vault.getSecrets().should.have.lengthOf(0)
      vault.getKeys().should.have.lengthOf(0)
    })

    it('should save the vault if the vault changed event is triggered', function () {
      // Given
      fs.writeFileSync.returns()
      const vaultClient = VaultFileClient.getInstance()
      const vault = vaultClient.getVault()

      // When
      vault.emit('changed', vault)

      // Then
      fs.writeFileSync.should.be.calledOnceWithExactly(filePath, sinon.match.string, fileEncoding)
    })
  })
})
