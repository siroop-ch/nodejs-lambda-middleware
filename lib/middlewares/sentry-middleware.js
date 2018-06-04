const R = require('ramda')
const Raven = require('raven');

const captureExceptionAndReturnPromise = (error, kwargs) => {
  if (process.env.enable_sentry !== 'true') {
    return Promise.resolve()
  }
  const messageFromError = error.message || '<no message>'
  const customSentryMessage = `${process.env.AWS_LAMBDA_FUNCTION_NAME} - ${messageFromError}`
  const updatedKwargs = R.merge(kwargs, {
    message: customSentryMessage,
    fingerprint: [process.env.AWS_LAMBDA_FUNCTION_NAME, customSentryMessage]
  })
  return new Promise(resolve => Raven.captureException(error, updatedKwargs, () => resolve()))
}

const getExtraData = (event, context) => {
  const records = event.Records
  const firstRecord = records && (records.length > 0) ? records[0] : null
  if (firstRecord && context) {
    return {
      eventSource: firstRecord.eventSource,
      eventSourceARN: firstRecord.eventSourceARN,
      lambdaRequestId: context.awsRequestId,
    }
  }
  return null
}

const SentryMiddleware = () => {
  let sentryInstalled = false
  return (event, context, next) => {
    if (process.env.enable_sentry === 'true') {
      const ravenConfiguration = {
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
        extra: getExtraData(event, context)
      }

      if (sentryInstalled === false) {
        Raven.config(process.env.sentry_dsn, ravenConfiguration).install()
        sentryInstalled = true
      }

      return Raven.context(() => next(event, context)
        .catch(error => captureExceptionAndReturnPromise(error, {})
          .then(() => Promise.reject(error))))
    }

    return next(event, context)
  }
}

SentryMiddleware.captureException = captureExceptionAndReturnPromise

module.exports = SentryMiddleware
