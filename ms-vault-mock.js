#!/usr/bin/env node

const path = require('path')
const fs = require('fs/promises')
const HttpServer = require('./lib/httpServer')
const VaultFileClient = require('./lib/persistence/VaultFileClient')

let httpPort = 10000
let httpsPort = 10001
let vaultDir = __dirname
let certificate, privateKey
let preloadFile
const vaultFile = 'vault.json'
const encoding = 'utf8'

const usage = `Usage: node ${path.basename(__filename)} [options...]
--http_port     HTTP port number (default ${httpPort})
--https_port    HTTPS port number (default ${httpsPort})
--certificate   certificate used to start HTTPS server (default none)
--private_key   private key used to start HTTPS server (default none)
--vault_dir     directory where vault file will be saved (default ${vaultDir})
--preload       dataset to preload in the vault before starting (default none)
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
          case '--preload':
            expect = 'preload_file'
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
      case 'preload_file':
        preloadFile = await checkFile(currentArg)
        expect = 'option'
        break
    }
  }

  if (!vaultDir) {
    console.error('can not load the vault')
    return
  }
  const vaultPath = path.join(vaultDir, vaultFile)
  const vaultFileClient = VaultFileClient.getInstance(vaultPath, encoding)

  if (preloadFile) {
    try {
      const stringifiedSecrets = await fs.readFile(preloadFile, 'utf8')
      const secretsToPreload = JSON.parse(stringifiedSecrets)
      vaultFileClient.getVault().setSecrets(secretsToPreload)
    } catch (error) {
      console.error(`can not preload the dataset ${preloadFile}: ${error.message}`, error.stack)
      return
    }
  }

  const httpServer = new HttpServer(httpPort, httpsPort, certificate, privateKey)
  httpServer.start()
}

bootstrap()
