const { expect } = require('chai')
const secretRouter = require('../../lib/routes/secretRouter')

describe('secretRouter', function () {
  it('should have a route GET /', function () {
    const getListRoute = secretRouter.stack.find(element => element.route.methods.get && element.route.path === '/')
    expect(getListRoute).to.exist()
  })
  it('should have a route GET /{secretName}', function () {
    const getIdRoute = secretRouter.stack.find(element => element.route.methods.get && element.route.path === '/:secretName')
    expect(getIdRoute).to.exist()
  })
  it('should have a route GET /{secretName}/{secretVersion}', function () {
    const getIdVersionRoute = secretRouter.stack.find(element => element.route.methods.get && element.route.path === '/:secretName/:secretVersion')
    expect(getIdVersionRoute).to.exist()
  })
  it('should have a route PUT /{secretName}', function () {
    const putIdRoute = secretRouter.stack.find(element => element.route.methods.put && element.route.path === '/:secretName')
    expect(putIdRoute).to.exist()
  })
  it('should have a route PATCH /{secretName}/{secretVersion}', function () {
    const patchIdVersionRoute = secretRouter.stack.find(element => element.route.methods.patch && element.route.path === '/:secretName/:secretVersion')
    expect(patchIdVersionRoute).to.exist()
  })
  it('should have a route DELETE /{secretName}', function () {
    const deleteIdRoute = secretRouter.stack.find(element => element.route.methods.delete && element.route.path === '/:secretName')
    expect(deleteIdRoute).to.exist()
  })
})
