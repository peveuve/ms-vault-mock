const { expect } = require('chai')
const appRouter = require('../../lib/routes/appRouter')

describe('appRouter', function () {
  it('should have a route GET /', function () {
    const getIndexRoute = appRouter.stack.find(element => element.route.methods.get && element.route.path === '/')
    expect(getIndexRoute).to.exist()
  })
})
