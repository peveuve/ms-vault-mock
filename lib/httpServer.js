const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const express = require('express')
const appRouter = require('./routes/appRouter')
const secretRouter = require('./routes/secretRouter')
const keyRouter = require('./routes/keyRouter')
const errorHandler = require('./errorHandler')

const encoding = 'utf8'

class HttpServer {
  constructor (httpPort, httpsPort, certificate, privateKey) {
    this.httpPort = httpPort
    this.httpsPort = httpsPort

    const app = express()

    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'pug')

    app.use(express.json())

    app.use('/', appRouter)
    app.use('/secrets', secretRouter)
    app.use('/keys', keyRouter)

    app.use(errorHandler.handleError)

    if (httpPort) {
      this.httpServer = http.createServer(app)
    }

    if (httpsPort && certificate && privateKey) {
      const certificateFile = fs.readFileSync(certificate, encoding)
      const privateKeyFile = fs.readFileSync(privateKey, encoding)
      const credentials = { key: privateKeyFile, cert: certificateFile }

      this.httpsServer = https.createServer(credentials, app)
    }
  }

  start () {
    if (this.httpServer) {
      this.httpServer.listen(this.httpPort, () => {
        console.log(`server listening on http port ${this.httpPort}`)
      })
    }
    if (this.httpsServer) {
      this.httpsServer.listen(this.httpsPort, () => {
        console.log(`server listening on https port ${this.httpsPort}`)
      })
    }
  }

  stop () {
    if (this.httpServer) {
      this.httpServer.close()
    }
    if (this.httpsServer) {
      this.httpsServer.close()
    }
  }
}

module.exports = HttpServer
