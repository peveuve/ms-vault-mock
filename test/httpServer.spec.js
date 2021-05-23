const proxyquire = require('proxyquire')
const sinon = require('sinon')
const http = require('http')
const https = require('https')
const fs = require('fs')
const app = {
  set: () => {},
  use: () => {}
}
const HttpServer = proxyquire('../lib/httpServer', {
  express: () => app
})

describe('HttpServer', function () {
  let sandbox
  let httpServerStub
  let httpsServerStub
  before(function () {
    sandbox = sinon.createSandbox()
    httpServerStub = {
      listen: sandbox.stub().callsFake((port, func) => func()),
      close: sandbox.stub()
    }
    sandbox.stub(http, 'createServer').returns(httpServerStub)
    httpsServerStub = {
      listen: sandbox.stub().callsFake((port, func) => func()),
      close: sandbox.stub()
    }
    sandbox.stub(https, 'createServer').returns(httpsServerStub)
    sandbox.stub(fs, 'readFileSync')
  })
  after(function () {
    sandbox.restore()
  })

  describe('start', function () {
    afterEach(function () {
      sandbox.resetHistory()
    })

    it('should start the http servers', function () {
      // Given
      const httpPort = 80
      const httpsPort = 443
      const certificateFile = 'certificateFile'
      const privateKeyFile = 'privateKeyFile'
      const certificate = 'certificate'
      const privateKey = 'privateKey'
      fs.readFileSync.withArgs(certificateFile, 'utf8').returns(certificate)
      fs.readFileSync.withArgs(privateKeyFile, 'utf8').returns(privateKey)

      // When
      const server = new HttpServer(httpPort, httpsPort, certificateFile, privateKeyFile)
      server.start()

      // Then
      fs.readFileSync.should.be.calledTwice()
      http.createServer.should.be.calledOnceWithExactly(app)
      httpServerStub.listen.should.be.calledOnce(httpPort, sinon.match.function)
      https.createServer.should.be.calledOnce({ key: privateKey, cert: certificate }, app)
      httpsServerStub.listen.should.be.calledOnce(httpsPort, sinon.match.function)
    })

    it('should not start the http servers without proper config', function () {
      // When
      const server = new HttpServer()
      server.start()

      // Then
      fs.readFileSync.should.not.be.called()
      http.createServer.should.not.be.called()
      httpServerStub.listen.should.not.be.called()
      https.createServer.should.not.be.called()
      httpsServerStub.listen.should.not.be.called()
    })
  })

  describe('stop', function () {
    afterEach(function () {
      sandbox.resetHistory()
    })

    it('should stop the http servers', function () {
      // Given
      const httpPort = 80
      const httpsPort = 443
      const certificateFile = 'certificateFile'
      const privateKeyFile = 'privateKeyFile'
      const certificate = 'certificate'
      const privateKey = 'privateKey'
      fs.readFileSync.withArgs(certificateFile, 'utf8').returns(certificate)
      fs.readFileSync.withArgs(privateKeyFile, 'utf8').returns(privateKey)

      // When
      const server = new HttpServer(httpPort, httpsPort, certificateFile, privateKeyFile)
      server.stop()

      // Then
      fs.readFileSync.should.be.calledTwice()
      http.createServer.should.be.calledOnceWithExactly(app)
      httpServerStub.close.should.be.calledOnce()
      https.createServer.should.be.calledOnce({ key: privateKey, cert: certificate }, app)
      httpsServerStub.close.should.be.calledOnce()
    })

    it('should not stop the http servers without proper config', function () {
      // When
      const server = new HttpServer()
      server.stop()

      // Then
      fs.readFileSync.should.not.be.called()
      http.createServer.should.not.be.called()
      httpServerStub.close.should.not.be.called()
      https.createServer.should.not.be.called()
      httpsServerStub.close.should.not.be.called()
    })
  })
})
