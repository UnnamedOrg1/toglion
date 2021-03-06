export interface Config {
  awsRegion: string
  regionalDynamoDBTableName: string
  globalDynamoDBTableName: string
  websocketApiEndpoint: string
}

export function getConfig(): Config {
  return {
    awsRegion: process.env.AWS_REGION!,
    regionalDynamoDBTableName: process.env.REGIONAL_DYNAMODB_TABLE!,
    globalDynamoDBTableName: process.env.GLOBAL_DYNAMODB_TABLE!,
    websocketApiEndpoint: process.env.WSAPI_GATEWAY_ENDPOINT!,
  }
}
