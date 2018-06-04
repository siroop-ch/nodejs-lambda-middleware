const t = require('tap')
const { middlewares } = require('../../../index')

const { withMiddlewares } = middlewares

t.test('withMiddlewares Examples', (t) => {
  const originalEvent = 'Original Event'
  const originalContext = 'Original Context'

  t.test('Multiple middlewares with only before logic', (assert) => {
    const actualCallOrder = []

    const middleware1 = (event, context, next) => {
      actualCallOrder.push([event, context, 'Before Middleware 1'])
      return next(event, context)
    }

    const middleware2 = (event, context, next) => {
      actualCallOrder.push([event, context, 'Before Middleware 2'])
      return next(event, context)
    }

    const dummyHandler = (event, context) => {
      actualCallOrder.push([event, context, 'Handler'])
      return Promise.resolve('Some Result')
    }

    const expectedCallOrder = [
      [originalEvent, originalContext, 'Before Middleware 1'],
      [originalEvent, originalContext, 'Before Middleware 2'],
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

  t.test('Multiple middlewares with before/after logic', (assert) => {
    const actualCallOrder = []

    const middleware1 = (event, context, next) => {
      actualCallOrder.push([event, context, 'Before Middleware 1'])
      return next(event, context).then((result) => {
        actualCallOrder.push([result, 'After Middleware 1'])
        return result
      })
    }

    const middleware2 = (event, context, next) => {
      actualCallOrder.push([event, context, 'Before Middleware 2'])

      return next(event, context).then((result) => {
        actualCallOrder.push([result, 'After Middleware 2'])
        return result
      })
    }

    const dummyHandler = (event, context) => {
      actualCallOrder.push([event, context, 'Handler'])
      return Promise.resolve('Some Result')
    }

    const expectedCallOrder = [
      [originalEvent, originalContext, 'Before Middleware 1'],
      [originalEvent, originalContext, 'Before Middleware 2'],
      [originalEvent, originalContext, 'Handler'],
      ['Some Result', 'After Middleware 2'],
      ['Some Result', 'After Middleware 1'],
    ]

    const handle = withMiddlewares(dummyHandler, [middleware1, middleware2])
    handle(originalEvent, originalContext, (error, result) => {
      assert.same(error, null)
      assert.same(result, 'Some Result')
      assert.same(actualCallOrder, expectedCallOrder)
      assert.done()
    })
  })

  t.test('Multiple middlewares with failure handler', (assert) => {
    const actualCallOrder = []
    const handlerError = 'Some Handler Error'

    const middleware1 = (event, context, next) => {
      actualCallOrder.push([event, context, 'Before Middleware 1'])
      return next(event, context).then((result) => {
        actualCallOrder.push([result, 'After Middleware 1'])
        return result
      }).catch((error) => {
        actualCallOrder.push([error, 'Error Middleware 1'])
        return Promise.reject(error)
      })
    }

    const middleware2 = (event, context, next) => {
      actualCallOrder.push([event, context, 'Before Middleware 2'])
      return next(event, context).then((result) => {
        actualCallOrder.push([result, 'After Middleware 2'])
        return result
      })
    }

    const dummyHandler = (event, context) => {
      actualCallOrder.push([event, context, 'Handler'])
      return Promise.reject(handlerError)
    }

    const expectedCallOrder = [
      [originalEvent, originalContext, 'Before Middleware 1'],
      [originalEvent, originalContext, 'Before Middleware 2'],
      [originalEvent, originalContext, 'Handler'],
      [handlerError, 'Error Middleware 1'],
    ]

    const handle = withMiddlewares(dummyHandler, [middleware1, middleware2])
    handle(originalEvent, originalContext, (error, result) => {
      assert.same(actualCallOrder, expectedCallOrder)
      assert.same(error, handlerError)
      assert.same(result, null)
      assert.done()
    })
  })

  t.done()
})
