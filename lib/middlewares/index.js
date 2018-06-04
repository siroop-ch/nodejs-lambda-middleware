const InsertOrModifyFilterMiddleware = require('./insert-or-modify-filter-middleware')
const DummyUpdatesFilterMiddleware = require('./dummy-updates-filter-middleware')
const SentryMiddleware = require('./sentry-middleware')
const DynamodbTTLRecordsFilterMiddleware = require('./dynamodb-ttl-records-filter-middleware')
const withMiddlewares = require('./with-middlewares')

module.exports = {
  InsertOrModifyFilterMiddleware,
  DummyUpdatesFilterMiddleware,
  SentryMiddleware,
  DynamodbTTLRecordsFilterMiddleware,
  withMiddlewares,
}
