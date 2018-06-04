const logger = require('../logger')
const R = require('ramda')

const withMiddlewares = (handler, middlewares = []) => (event, context, callback) => {
  logger.info('Processing Event', {
    arn: R.path(['Records', '0', 'eventSourceARN'], event),
    name: R.path(['Records', '0', 'eventName'], event),
    source: R.path(['Records', '0', 'eventSource'], event),
  })

  const chainMiddlewares = ([firstMiddleware, ...restOfMiddlewares]) => {
    if (firstMiddleware) {
      return (e, c) => {
        try {
          return firstMiddleware(e, c, chainMiddlewares(restOfMiddlewares))
        } catch (error) {
          return Promise.reject(error)
        }
      }
    }

    return handler
  }

  chainMiddlewares(middlewares)(event, context)
    .then(result => callback(null, result))
    .catch((err) => {
      logger.error('handle failed', { err, event, context })
      callback(err, null)
    })
}

module.exports = withMiddlewares
