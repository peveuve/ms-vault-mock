const { expect } = require('chai')
const keyRouter = require('../../lib/routes/keyRouter')

describe('keyRouter', function () {
  it('should have a route GET /', function () {
    const getListRoute = keyRouter.stack.find(element => element.route.methods.get && element.route.path === '/')
    expect(getListRoute).to.exist()
  })
})
