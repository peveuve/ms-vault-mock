#!/usr/bin/env node

const path = require('path')
const fs = require('fs/promises')
const HttpServer = require('./lib/httpServer')
const VaultFileClient = require('./lib/persistence/vaultFileClient')

let httpPort = 10000
let httpsPort = 10001
let vaultDir = __dirname
let certificate, privateKey
const vaultFile = 'vault.json'
const encoding = 'utf8'

const usage = `Usage: node ${path.basename(__filename)} [options...]
--http_port     HTTP port number (default ${httpPort})
--https_port    HTTPS port number (default ${httpsPort})
--certificate   certificate used to start HTTPS server
--private_key   private key used to start HTTPS server
--vault_dir     directory where vault file will be saved (default ${vaultDir})
--help          display this message

Azure key vault client demands HTTPS enabled, which requires
a certificate and a private key to start the server.
If using a self-signed certificate, allow unsecured requests
with the environment variable NODE_TLS_REJECT_UNAUTHORIZED=0.
Check openssl to generate keys and self-signed certificate.
`

function checkInteger (valueToCheck) {
  const parsedValue = Number.parseInt(valueToCheck)
  if (Number.isInteger(parsedValue)) {
    return parsedValue
  }
  console.error(`argument ${valueToCheck} is not an integer`)
}

async function checkFile (valueToCheck) {
  try {
    const fileStat = await fs.stat(valueToCheck)
    if (fileStat.isFile()) {
      return valueToCheck
    }
  } catch (error) {}
  console.error(`argument ${valueToCheck} is not a file`)
}

async function checkDirectory (valueToCheck) {
  try {
    const fileStat = await fs.stat(valueToCheck)
    if (fileStat.isDirectory()) {
      return valueToCheck
    }
  } catch (error) {}
  console.error(`argument ${valueToCheck} is not a directory`)
}

async function bootstrap () {
  let expect = 'option'

  const currentArgs = process.argv.slice(2)

  for (const currentArg of currentArgs) {
    switch (expect) {
      case 'option':
        switch (currentArg) {
          case '--help':
            console.log(usage)
            return
          case '--http_port':
            expect = 'http_port'
            break
          case '--https_port':
            expect = 'https_port'
            break
          case '--certificate':
            expect = 'certificate'
            break
          case '--private_key':
            expect = 'private_key'
            break
          case '--vault_dir':
            expect = 'vault_dir'
            break
          default:
            console.error(`Unknown option ${currentArg} ignored`)
            console.log(usage)
        }
        break
      case 'http_port':
        httpPort = checkInteger(currentArg)
        expect = 'option'
        break
      case 'https_port':
        httpsPort = checkInteger(currentArg)
        expect = 'option'
        break
      case 'certificate':
        certificate = await checkFile(currentArg)
        expect = 'option'
        break
      case 'private_key':
        privateKey = await checkFile(currentArg)
        expect = 'option'
        break
      case 'vault_dir':
        vaultDir = await checkDirectory(currentArg)
        expect = 'option'
        break
    }
  }

  const vaultPath = path.join(vaultDir, vaultFile)
  VaultFileClient.getInstance(vaultPath, encoding)

  const httpServer = new HttpServer(httpPort, httpsPort, certificate, privateKey)
  httpServer.start()
}

bootstrap()
