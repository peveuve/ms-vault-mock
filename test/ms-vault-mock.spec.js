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
  before(function () {
    sandbox = sinon.createSandbox()
    statStub = {
      isFile: sandbox.stub(),
      isDirectory: sandbox.stub()
    }
    sandbox.stub(fs, 'stat').resolves(statStub)
    sandbox.stub(VaultFileClient, 'getInstance')
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

  it('should start the server with all valid options', function (done) {
    // Given
    process.argv = [
      'node', 'ms-vault-mock',
      '--http_port', '80',
      '--https_port', '443',
      '--certificate', 'certificate',
      '--private_key', 'privateKey',
      '--vault_dir', '/'
    ]
    statStub.isFile.returns(true)
    statStub.isDirectory.returns(true)

    // When
    proxyquire('../ms-vault-mock', {
      './lib/httpServer': HttpServer
    })

    // Then
    httpServerInstance.start.callsFake(() => {
      VaultFileClient.getInstance.should.be.calledOnceWithExactly('/vault.json', 'utf8')
      HttpServer.should.be.calledOnceWithExactly(80, 443, 'certificate', 'privateKey')
      httpServerInstance.start.should.be.calledOnceWithExactly()
      done()
    })
  })

  it('should not start the server with invalid options', function () {
    // Given
    process.argv = [
      'node', 'ms-vault-mock',
      '--http_port', 'aa',
      '--certificate', 'certificate',
      '--private_key', 'privateKey',
      '--vault_dir', '/',
      '--????'
    ]
    statStub.isFile.returns(false)
    statStub.isDirectory.returns(false)

    // When
    proxyquire('../ms-vault-mock', {
      './lib/httpServer': HttpServer
    })

    // Then
    httpServerInstance.start.callsFake(() => {
      VaultFileClient.getInstance.should.be.calledOnceWithExactly('vault.json', 'utf8')
      HttpServer.should.be.calledOnceWithExactly(undefined, undefined, undefined, undefined)
      httpServerInstance.start.should.be.calledOnceWithExactly()
    })
  })
})
