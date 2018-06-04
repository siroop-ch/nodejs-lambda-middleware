const t = require('tap')
const sinon = require('sinon')
const R = require('ramda')

const { middlewares } = require('../../../index')
const testHelpers = require('../test-helpers.js')

const { DynamodbTTLRecordsFilterMiddleware } = middlewares

const {
  lambdaEventWithDynamoRecords,
  lambdaEventWithModifedDynamoRecord,
  lambdaEventWithRemovedDynamoRecords
} = testHelpers


const item = {
  id: '544906',
  name: 'Name'
}

const context = {}
const nextValue = 'Next';
let nextStub
t.beforeEach(() => {
  nextStub = sinon.stub()
  return Promise.resolve()
})

const middleware = DynamodbTTLRecordsFilterMiddleware()

t.test('dynamodb events', (t) => {
  t.test('should filter out insert events', (assert) => {
    const event = lambdaEventWithDynamoRecords(item)
    nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))

    return middleware(event, context, nextStub)
      .then(() => {
        assert.same(event.Records.length, 0)
      })
  })

  t.test('should filter out modify events', (assert) => {
    const oldItem = R.clone(item)
    item.name = 'OldName'
    const event = lambdaEventWithModifedDynamoRecord(item, oldItem)
    nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))

    return middleware(event, context, nextStub)
      .then(() => {
        assert.same(event.Records.length, 0)
      })
  })

  t.test('should keep remove events', (assert) => {
    const event = lambdaEventWithRemovedDynamoRecords(item)
    nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))
    return middleware(event, context, nextStub)
      .then(() => {
        assert.same(event.Records.length, 1)
      })
  })

  t.done()
})
