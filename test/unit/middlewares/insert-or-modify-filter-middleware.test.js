const t = require('tap')
const sinon = require('sinon')
const { middlewares } = require('../../../index')
const testHelpers = require('../test-helpers.js')

const { InsertOrModifyFilterMiddleware } = middlewares

const {
  lambdaEventWithDynamoRecords
} = testHelpers


const item = {
  id: '544906',
  meta: {
    timestamp: Date.now()
  },
  concreteProducts: [
    {
      id: '670319-1',
      isActive: true,
      offers: [
        'a;b'
      ]
    }
  ]
}

const lambdaName = 'ProductOfferOffer'
const context = { functionName: lambdaName }
const nextValue = 'Next';
let nextStub
t.beforeEach(() => {
  nextStub = sinon.stub()
  return Promise.resolve()
})

t.test('dynamodb events with insert or update middleware enabled', (t) => {
  const insertOrModifyFilterMiddleware = InsertOrModifyFilterMiddleware()

  t.test('should filter out delete events', (t) => {
    const event = lambdaEventWithDynamoRecords(item)
    event.Records[0].eventName = 'REMOVE'
    nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))

    insertOrModifyFilterMiddleware(event, context, nextStub)
      .then(() => {
        t.same(event.Records.length, 0)
        t.done()
      })
  })

  t.test('should keep insert or modify events', (t) => {
    const event = lambdaEventWithDynamoRecords(item)
    nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))
    insertOrModifyFilterMiddleware(event, context, nextStub)
      .then(() => {
        t.same(event.Records.length, 1)
        t.done()
      })
  })
  t.done()
})
