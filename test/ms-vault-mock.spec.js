const sinon = require('sinon')
const proxyquire = require('proxyquire')
const fs = require('fs/promises')
const process = require('process')
const VaultFileClient = require('../lib/persistence/VaultFileClient')

describe('ms-vault-mock', function () {
  let sandbox
  let HttpServer
  let httpServerInstance
  let statStub
  let vaultStub
  let vaultFileClientStub
  before(function () {
    sandbox = sinon.createSandbox()
    statStub = {
      isFile: sandbox.stub(),
      isDirectory: sandbox.stub()
    }
    sandbox.stub(fs, 'readFile')
    sandbox.stub(fs, 'stat').resolves(statStub)
    vaultStub = {
      setSecrets: sandbox.stub()
    }
    vaultFileClientStub = {
      getVault: sandbox.stub().returns(vaultStub)
    }
    sandbox.stub(VaultFileClient, 'getInstance').returns(vaultFileClientStub)
    httpServerInstance = {
      start: sandbox.stub()
    }
    HttpServer = sandbox.stub().callsFake(() => httpServerInstance)
  })
  after(function () {
    sandbox.restore()
  })
  afterEach(function () {
    sandbox.resetHistory()
  })

  it('should display help', function () {
    // Given
    process.argv = ['node', 'ms-vault-mock', '--help']

    // When
    proxyquire('../ms-vault-mock', {
      './lib/httpServer': HttpServer
    })

    // Then
    VaultFileClient.getInstance.should.not.be.called()
    HttpServer.should.not.be.called()
    httpServerInstance.start.should.not.be.called()
  })

  it('should start the server with minimum options', function (done) {
    // Given
    process.argv = ['node', 'ms-vault-mock']

    // Then
    httpServerInstance.start.callsFake(() => {
      VaultFileClient.getInstance.should.be.calledOnceWithExactly(sinon.match.string, 'utf8')
      vaultFileClientStub.getVault.should.not.be.called()
      vaultStub.setSecrets.should.not.be.called()
      HttpServer.should.be.calledOnceWithExactly(10000, 10001, undefined, undefined)
      httpServerInstance.start.should.be.calledOnceWithExactly()
      done()
    })

    // When
    proxyquire('../ms-vault-mock', {
      './lib/httpServer': HttpServer
    })
  })

  it('should start the server with all valid options', function (done) {
    // Given
    process.argv = [
      'node', 'ms-vault-mock',
      '--http_port', '80',
      '--https_port', '443',
      '--certificate', 'certificate',
      '--private_key', 'privateKey',
      '--vault_dir', '/',
      '--preload', 'secrets.json'
    ]
    const secretsToPreload = '{ "secret1": "value1" }'
    fs.readFile.resolves(secretsToPreload)
    statStub.isFile.returns(true)
    statStub.isDirectory.returns(true)

    // Then
    httpServerInstance.start.callsFake(() => {
      VaultFileClient.getInstance.should.be.calledOnceWithExactly('/vault.json', 'utf8')
      vaultFileClientStub.getVault.should.be.calledOnceWithExactly()
      vaultStub.setSecrets.should.be.calledOnceWithExactly(JSON.parse(secretsToPreload))
      HttpServer.should.be.calledOnceWithExactly(80, 443, 'certificate', 'privateKey')
      httpServerInstance.start.should.be.calledOnceWithExactly()
      done()
    })

    // When
    proxyquire('../ms-vault-mock', {
      './lib/httpServer': HttpServer
    })
  })

  it('should not start the server if the dataset to preload is invalid', function () {
    // Given
    process.argv = [
      'node', 'ms-vault-mock',
      '--preload', 'secrets.json'
    ]
    const brokenSecrets = '"secret1": "value1" }'
    fs.readFile.resolves(brokenSecrets)
    statStub.isFile.returns(true)

    // When
    proxyquire('../ms-vault-mock', {
      './lib/httpServer': HttpServer
    })

    // Then
    VaultFileClient.getInstance.should.not.be.called()
    vaultFileClientStub.getVault.should.not.be.called()
    vaultStub.setSecrets.should.not.be.called()
    HttpServer.should.not.be.called()
    httpServerInstance.start.should.not.be.called()
  })

  it('should not start the server with invalid options', function () {
    // Given
    process.argv = [
      'node', 'ms-vault-mock',
      '--http_port', 'aa',
      '--certificate', 'certificate',
      '--private_key', 'privateKey',
      '--vault_dir', 'bbb',
      '--????'
    ]
    statStub.isFile.returns(false)
    statStub.isDirectory.returns(false)

    // When
    proxyquire('../ms-vault-mock', {
      './lib/httpServer': HttpServer
    })

    // Then
    VaultFileClient.getInstance.should.not.be.called()
    vaultFileClientStub.getVault.should.not.be.called()
    vaultStub.setSecrets.should.not.be.called()
    HttpServer.should.not.be.called()
    httpServerInstance.start.should.not.be.called()
  })
})
