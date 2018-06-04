const isRemoveEvent = record => record.eventName === 'REMOVE'

const DynamodbTTLRecordsFilterMiddleware = () => (event, context, next) => {
  const filteredRecords = event.Records.filter(isRemoveEvent)
  const mutatedEvent = event
  mutatedEvent.Records = filteredRecords
  return next(event, context)
}

module.exports = DynamodbTTLRecordsFilterMiddleware
