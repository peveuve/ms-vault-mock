# Azure Key Vault mock server

This project provides a mock server for Azure Key Vault, similar to azurite for Azure Storage.
Implemented with Node.js

## Installation

> npm install --save-dev --global ms-vault-mock

## Usage

Start the mock server with the following command:
> ms-vault-mock --certificate *<path_to_cert>* --private_key *<path_to_private_key>*

The Azure key vault clients will refuse to send requests over unsecured connections, 
so you have to provide a certificate and a private key to the mock server so it can enable HTTPS.
Use [openssl](https://www.openssl.org/) to generate a certificate and a private key.

If your certificate is self-signed, Node will refuse to initiate a connection for security reason.
To change this behavior, set the following environment variable:
> set NODE_TLS_REJECT_UNAUTHORIZED=0

The vault is written in a JSON file in the current directory by default.
This directory can be changed with the option *--vault_dir*.

You can preload a dataset of secrets at startup to populate your vault.
The format of the dataset must be an JSON object with keys being the secret names and values being the secret values:
> { "secretName": "secretValue" }

If the secret already exists in the vault, the value will be added to the secret's versions.
If a secret version already exists in the vault for the value, the value won't be added in a new version.

For more details about the various options, type:
> ms-vault-mock --help

## Implementation

Only a subset of the [Azure Key Vault API](https://docs.microsoft.com/en-us/rest/api/keyvault/) is implemented so far:
 - GET /secrets
 - GET /secrets/{name}
 - PUT /secrets/{name}
 - DELETE /secrets/{name}
 - GET /secrets/{name}/{version}
 - PATCH /secrets/{name}/{version}
 - GET /keys

