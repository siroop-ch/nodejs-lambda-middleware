const t = require('tap')
const sinon = require('sinon')
const Raven = require('raven')
const { middlewares } = require('../../../index')

const { SentryMiddleware } = middlewares

const withRavenStubs = (t) => {
  const stubs = {}

  t.beforeEach(() => {
    process.env.enable_sentry = 'true'
    stubs.config = sinon.stub(Raven, 'config').returnsThis()
    stubs.install = sinon.stub(Raven, 'install')
    stubs.context = sinon.stub(Raven, 'context').callsFake(fn => fn())
    stubs.captureException = sinon.stub(Raven, 'captureException')
    return Promise.resolve()
  })

  t.afterEach(() => {
    stubs.config.restore()
    stubs.install.restore()
    stubs.context.restore()
    stubs.captureException.restore()
    return Promise.resolve()
  })

  return stubs
}

const event = 'event'
const context = 'context'
const nextValue = 'Next';

let nextStub
t.beforeEach(() => {
  nextStub = sinon.stub()
  nextStub.withArgs(event, context).returns(Promise.resolve(nextValue))
  return Promise.resolve()
})

t.test('with sentry middleware enabled', (t) => {
  const ravenStubs = withRavenStubs(t)

  t.test('should configure and install raven', (assert) => {
    const sentryDSN = 'https://<key>:<secret>@sentry.io/<project>'
    process.env.environment = 'env'
    process.env.version = 'version'
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'lambda function'
    process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = 'lambda memory size'
    process.env.AWS_LAMBDA_LOG_GROUP_NAME = 'lambda log group'
    process.env.AWS_LAMBDA_LOG_STREAM_NAME = 'lambda log stream'
    process.env.AWS_REGION = 'aws region'
    process.env.sentry_dsn = sentryDSN

    const expectedConfiguration = {
      environment: process.env.environment,
      release: process.env.version,
      autoBreadcrumbs: false,
      tags: {
        lambda: process.env.AWS_LAMBDA_FUNCTION_NAME,
        memory_size: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        log_group: process.env.AWS_LAMBDA_LOG_GROUP_NAME,
        log_stream: process.env.AWS_LAMBDA_LOG_STREAM_NAME,
        region: process.env.AWS_REGION
      },
      extra: null
    }

    const sentryMiddleware = SentryMiddleware()
    sentryMiddleware(event, context, nextStub)
    sinon.assert.calledWith(ravenStubs.config, sentryDSN, expectedConfiguration)
    assert.ok(ravenStubs.install.called)
    assert.done()
  })

  t.test('should call next middleware and return', (assert) => {
    const sentryMiddleware = SentryMiddleware()
    sentryMiddleware(event, context, nextStub)
      .then((returnValue) => {
        assert.same(returnValue, 'Next')
        assert.ok(ravenStubs.config.called)
        assert.done()
      })
  })

  t.test('should call middleware inside Raven.context', (assert) => {
    const sentryMiddleware = SentryMiddleware()
    sentryMiddleware(event, context, nextStub)
      .then((returnValue) => {
        assert.same(returnValue, 'Next')
        assert.ok(ravenStubs.context.called)
        assert.done()
      })
  })

  t.test('should configure and install raven only once', (assert) => {
    const sentryMiddleware = SentryMiddleware()
    sentryMiddleware(event, context, nextStub)
    sentryMiddleware(event, context, nextStub)
      .then((returnValue) => {
        assert.same(returnValue, nextValue)
        sinon.assert.calledOnce(ravenStubs.config)
        sinon.assert.calledOnce(ravenStubs.install)

        assert.done()
      })
  })

  t.test('should catch exception and pass it to sentry', (assert) => {
    const exception = new Error('Nasty Exception')
    ravenStubs.captureException.yields()
    const sentryMiddleware = SentryMiddleware()
    sentryMiddleware(event, context, () => Promise.reject(exception))
      .catch((error) => {
        assert.same(error, exception)
        assert.ok(ravenStubs.captureException.called)
        assert.done()
      })
  })

  t.test('should add event source and source ARN to kwargs.extra if available', (assert) => {
    const exception = new Error('Nasty Exception')
    const sourceAndARN = {
      eventSource: 'test:eventSource',
      eventSourceARN: 'test:eventSourceARN'
    }
    const eventWithRecords = { Records: [sourceAndARN] }
    const sentryKwargs = { }
    const sentryMiddleware = SentryMiddleware()
    ravenStubs.captureException.yields()

    sentryMiddleware(eventWithRecords, context, () => Promise.reject(exception))
      .catch((error) => {
        assert.same(error, exception)
        sinon.assert.calledWith(
          ravenStubs.captureException, sinon.match(exception),
          sinon.match(sentryKwargs), sinon.match.func
        )
        assert.done()
      })
  })

  t.test('should not add event source and source ARN to kwargs.extra if not available', (assert) => {
    const exception = new Error('Nasty Exception')
    const sentryMiddleware = SentryMiddleware()
    ravenStubs.captureException.yields()

    sentryMiddleware(event, context, () => Promise.reject(exception))
      .catch((error) => {
        assert.same(error, exception)
        sinon.assert.calledWith(
          ravenStubs.captureException, sinon.match(exception),
          sinon.match({}), sinon.match.func
        )
        assert.done()
      })
  })

  t.test('should prepend error message with lambda name', (assert) => {
    const errorMessage = 'Nasty Exception'
    const exception = new Error(errorMessage)
    const expectedMessage = `${process.env.AWS_LAMBDA_FUNCTION_NAME} - ${errorMessage}`
    const sourceAndARN = {
      eventSource: 'test:eventSource',
      eventSourceARN: 'test:eventSourceARN'
    }
    const eventWithRecords = { Records: [sourceAndARN] }
    const expectedSentryKwargs = { message: expectedMessage }
    const sentryMiddleware = SentryMiddleware()
    ravenStubs.captureException.yields()

    sentryMiddleware(eventWithRecords, context, () => Promise.reject(exception))
      .catch((error) => {
        assert.same(error.message, exception.message)
        sinon.assert.calledWith(
          ravenStubs.captureException, sinon.match(exception),
          sinon.match(expectedSentryKwargs), sinon.match.func
        )
        assert.done()
      })
  })

  t.done()
})

t.test('with sentry middleware not enabled', (t) => {
  const ravenStubs = withRavenStubs(t)

  t.beforeEach(() => {
    process.env.enable_sentry = 'false'
    return Promise.resolve()
  })

  t.test('should not configure and install raven', (assert) => {
    const sentryMiddleware = SentryMiddleware()
    sentryMiddleware(event, context, nextStub)

    assert.notOk(ravenStubs.config.called)
    assert.notOk(ravenStubs.install.called)
    assert.done()
  })

  t.test('should call next middleware and return', (assert) => {
    const sentryMiddleware = SentryMiddleware()
    sentryMiddleware(event, context, nextStub)
      .then((returnValue) => {
        assert.same(returnValue, nextValue)
        sinon.assert.calledWith(nextStub, event, context)
        assert.done()
      })
  })

  t.test('should not call middleware inside Raven.context', (assert) => {
    const sentryMiddleware = SentryMiddleware()
    sentryMiddleware(event, context, nextStub)
      .then((returnValue) => {
        assert.same(returnValue, 'Next')
        assert.notOk(ravenStubs.context.called)
        assert.done()
      })
  })

  t.done()
})
