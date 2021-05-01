const http = require('http')
const https = require('https')
const fs = require('fs')
const express = require('express')
const { ValidationError } = require('express-validation')
const appRouter = require('./routes/appRouter')
const secretRouter = require('./routes/secretRouter')
const KeyVaultError = require('./domain/KeyVaultError')

const encoding = 'utf8'

class HttpServer {
  constructor (httpPort, httpsPort, certificate, privateKey) {
    this.httpPort = httpPort
    this.httpsPort = httpsPort

    const app = express()

    app.set('views', './lib/views')
    app.set('view engine', 'pug')

    app.use(express.json())

    app.use((req, res, next) => {
      console.log(`${req.method} ${req.originalUrl}`)
      next()
    })

    app.use('/', appRouter)
    app.use('/secrets', secretRouter)

    app.use((error, req, res, next) => {
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(error)
      } else if (error instanceof KeyVaultError) {
        const responseBody = {
          error: {
            code: error.code,
            message: error.message,
            innererror: error.innererror
          }
        }
        res.status(500).json(responseBody)
      } else {
        const responseBody = {
          error: {
            code: 500,
            message: error.message
          }
        }
        res.status(500).json(responseBody)
      }
    })

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
