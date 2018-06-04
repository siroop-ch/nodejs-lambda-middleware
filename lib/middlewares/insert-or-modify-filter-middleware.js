const isInsertOrModifyEvent = record => (
  record.eventName === 'INSERT' || record.eventName === 'MODIFY'
)

const InsertOrModifyFilterMiddleware = () => (event, context, next) => {
  const filteredRecords = event.Records.filter(isInsertOrModifyEvent)
  const mutatedEvent = event
  mutatedEvent.Records = filteredRecords
  return next(event, context)
}

module.exports = InsertOrModifyFilterMiddleware
