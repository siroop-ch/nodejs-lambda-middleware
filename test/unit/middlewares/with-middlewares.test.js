const t = require('tap')
const { middlewares } = require('../../../index')

const { withMiddlewares } = middlewares

const passingHandler = obj => () => Promise.resolve(obj)
const failingHandler = obj => () => Promise.reject(obj)

t.test('withMiddlewares', (t) => {
  t.test('No middlewares', (t) => {
    t.test('should call given handler with given event and context', (assert) => {
      const originalEvent = 'Original Event'
      const originalContext = 'Original Context'

      let receivedEvent
      let receivedContext
      const dummyHandler = (event, context) => {
        receivedEvent = event
        receivedContext = context
        return Promise.resolve('Some Result')
      }

      withMiddlewares(dummyHandler)(originalEvent, originalContext, () => {
        assert.same(originalEvent, receivedEvent)
        assert.same(originalContext, receivedContext)
        assert.done()
      })
    })

    t.test('should return result to callback on success', (assert) => {
      const successMsg = 'Some Result'

      withMiddlewares(passingHandler(successMsg))({}, null, (error, result) => {
        assert.same(error, null)
        assert.same(result, 'Some Result')
        assert.done()
      })
    })

    t.test('should return result to callback on failure', (assert) => {
      const failureMsg = 'failure'

      withMiddlewares(failingHandler(failureMsg))({}, null, (error, result) => {
        assert.same(error, failureMsg)
        assert.same(result, null)
        assert.done()
      })
    })

    t.done()
  })

  t.test('with middlewares', (t) => {
    const originalEvent = 'Original Event'
    const originalContext = 'Original Context'

    t.test('should call middlewares in the given order with given event/context and then the handler', (assert) => {
      const actualCallOrder = []

      const middleware1 = (event, context, next) => {
        actualCallOrder.push([event, context, 'Middleware 1'])
        return next(event, context)
      }

      const middleware2 = (event, context, next) => {
        actualCallOrder.push([event, context, 'Middleware 2'])
        return next(event, context)
      }

      const dummyHandler = (event, context) => {
        actualCallOrder.push([event, context, 'Handler'])
        return Promise.resolve('Some Result')
      }

      const expectedCallOrder = [
        [originalEvent, originalContext, 'Middleware 1'],
        [originalEvent, originalContext, 'Middleware 2'],
        [originalEvent, originalContext, 'Handler']
      ]

      const handle = withMiddlewares(dummyHandler, [middleware1, middleware2])
      handle(originalEvent, originalContext, (error, result) => {
        assert.same(error, null)
        assert.same(result, 'Some Result')
        assert.same(actualCallOrder, expectedCallOrder)
        assert.done()
      })
    })

    t.test('should not call further middlewares and handler if one of the middleware fails', (assert) => {
      const actualCallOrder = []
      const middleware1Error = 'Middleware 1 Failure'

      const middleware1 = (event, context) => {
        actualCallOrder.push([event, context, 'Middleware 1'])
        throw middleware1Error
      }

      const middleware2 = (event, context, next) => {
        actualCallOrder.push([event, context, 'Middleware 2'])
        return next(event, context)
      }

      const dummyHandler = (event, context) => {
        actualCallOrder.push([event, context, 'Handler'])
        return Promise.resolve()
      }

      const expectedCallOrder = [
        [originalEvent, originalContext, 'Middleware 1'],
      ]

      const handle = withMiddlewares(dummyHandler, [middleware1, middleware2])
      handle(originalEvent, originalContext, (error, result) => {
        assert.same(error, middleware1Error)
        assert.same(result, null)
        assert.same(actualCallOrder, expectedCallOrder)
        assert.done()
      })
    })

    t.done()
  })

  t.done()
})
