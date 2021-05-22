const VaultFileClient = require('../persistence/VaultFileClient')

module.exports.getRoot = (req, res) => {
  const secrets = VaultFileClient.getInstance().getVault().getSecrets()
  res.render('index', { secrets })
}
