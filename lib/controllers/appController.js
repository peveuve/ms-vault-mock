const VaultFileClient = require('../persistence/VaultFileClient')

module.exports.getRoot = (req, res) => {
  const vault = VaultFileClient.getInstance().getVault()
  const secrets = vault.getSecrets()
  const keys = vault.getKeys()
  res.render('index', { secrets, keys })
}
