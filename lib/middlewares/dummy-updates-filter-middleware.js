const R = require('ramda')
const logger = require('../logger')
const AWS = require('aws-sdk')

const parseRecord = (record, imageType) => {
  if (!(imageType in record.dynamodb)) {
    return null
  }

  return AWS.DynamoDB.Converter.output({ M: record.dynamodb[imageType] })
}

const DummyUpdatesFilterMiddleware = selector => (event, context, next) => {
  const filteredRecords = event.Records.filter((record) => {
    const oldImage = parseRecord(record, 'NewImage')
    const newImage = parseRecord(record, 'OldImage')
    const oldSelectorImage = oldImage ? selector(oldImage) : null
    const newSelectorImage = selector(newImage)
    const isValidUpdate = (!oldImage || !R.equals(oldSelectorImage, newSelectorImage))

    logger.debug('Dummy Update Check', {
      dummyUpdatesCheck: {
        isValidUpdate,
        oldSelectorImage,
        newSelectorImage,
      }
    })

    return isValidUpdate
  })

  const orginalRecordsCount = event.Records.length
  event.Records = filteredRecords

  return next(event, context).then((nextResponse) => {
    logger.debug('Dummy Records Count', {
      dummyRecordsCheck: {
        recordsCount: orginalRecordsCount,
        filteredRecordsCount: filteredRecords.length,
      }
    })

    return nextResponse
  })
}

module.exports = DummyUpdatesFilterMiddleware
