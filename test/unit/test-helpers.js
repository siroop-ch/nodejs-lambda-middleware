const AWS = require('aws-sdk')

const encodeToDynamoDB = AWS.DynamoDB.Converter.input

const lambdaEventWithDynamoRecords = (...records) => ({
  Records: records.map(record => ({
    dynamodb: {
      NewImage: encodeToDynamoDB(record).M
    },
    eventSourceARN: 'table-arn',
    eventSource: 'aws:dynamodb',
    eventName: 'INSERT'
  }))
})

const lambdaEventWithModifedDynamoRecord = (newRecord, oldRecord) => ({
  Records: [{
    dynamodb: {
      OldImage: encodeToDynamoDB(oldRecord || {}).M,
      NewImage: encodeToDynamoDB(newRecord).M
    },
    eventSourceARN: 'table-arn',
    eventSource: 'aws:dynamodb',
    eventName: 'MODIFY'
  }]
})

const lambdaEventWithRemovedDynamoRecords = (...records) => ({
  Records: records.map(record => ({
    dynamodb: {
      OldImage: encodeToDynamoDB(record).M
    },
    eventSourceARN: 'table-arn',
    eventSource: 'aws:dynamodb',
    eventName: 'REMOVE'
  }))
})

module.exports = {
  lambdaEventWithDynamoRecords,
  lambdaEventWithModifedDynamoRecord,
  lambdaEventWithRemovedDynamoRecords
}
