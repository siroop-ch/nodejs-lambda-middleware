const t = require('tap')
const sinon = require('sinon')
const R = require('ramda')
const { middlewares } = require('../../../index')
const testHelpers = require('../test-helpers.js')

const { DummyUpdatesFilterMiddleware } = middlewares

const {
  lambdaEventWithDynamoRecords,
  lambdaEventWithModifedDynamoRecord
} = testHelpers


const item = {
  id: '544906',
}

const context = { functionName: 'SomeLambda' }
const nextValue = 'Next';
let nextStub
t.beforeEach(() => {
  nextStub = sinon.stub()
  return Promise.resolve()
})

t.test('dynamodb events', (t) => {
  t.test('MODIFY events', (t) => {
    t.test('should remove records if valueSelector returns same for oldImage and newImage', (t) => {
      const dummyUpdatesFilterMiddleware = DummyUpdatesFilterMiddleware(R.omit(['timestamp']))
      const oldItem = {
        id: 1,
        name: 'name',
        timestamp: 100
      }

      const newItem = {
        id: 1,
        name: 'name',
        timestamp: 200
      }

      const event = lambdaEventWithModifedDynamoRecord(newItem, oldItem)
      nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))
      dummyUpdatesFilterMiddleware(event, context, nextStub)
        .then(() => {
          t.same(event.Records.length, 0)
          t.done()
        })
    })

    t.test('should not remove records if valueSelector returns different for oldImage and newImage', (t) => {
      const dummyUpdatesFilterMiddleware = DummyUpdatesFilterMiddleware(R.omit(['timestamp']))
      const oldItem = {
        id: 1,
        name: 'name',
        timestamp: 100
      }

      const newItem = {
        id: 1,
        name: 'NewName',
        timestamp: 200
      }

      const event = lambdaEventWithModifedDynamoRecord(newItem, oldItem)
      nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))
      dummyUpdatesFilterMiddleware(event, context, nextStub)
        .then(() => {
          t.same(event.Records.length, 1)
          t.done()
        })
    })

    t.done()
  })

  t.test('should pass through INSERT events', (t) => {
    const dummyUpdatesFilterMiddleware = DummyUpdatesFilterMiddleware(R.identity)

    const event = lambdaEventWithDynamoRecords(item)
    nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))
    dummyUpdatesFilterMiddleware(event, context, nextStub)
      .then(() => {
        t.same(event.Records.length, 1)
        t.done()
      })
  })

  t.done()
})
