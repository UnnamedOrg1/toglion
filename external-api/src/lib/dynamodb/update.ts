import {UpdateItemCommandInput} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBTableNameParams,
  generateExpressionAttributeNameIf,
  generateExpressionAttributeValueStrings,
} from '.'
import {DynamoDBParams, Entry, InsertOrUpdateOptions, Key} from './types'
import {encodeKeys, generateExpressionAttributeNames} from './utils'

export interface GenerateUpdateParams<T extends object>
  extends DynamoDBTableNameParams {
  key: Key
  sortKey?: Key
  value: T
  options?: InsertOrUpdateOptions
}
export function generateUpdate<T extends object = object>({
  tableName,
  key,
  sortKey,
  value,
  options,
}: GenerateUpdateParams<T>): UpdateItemCommandInput {
  const now = new Date()
  const upsert = options?.upsert
  const utcSecondsSinceEpoch =
    Math.round(now.getTime() / 1000) + now.getTimezoneOffset() * 60
  return {
    TableName: tableName,
    ConditionExpression: upsert ? undefined : 'attribute_exists(PartitionKey)',
    ReturnValues: 'ALL_OLD',
    Key: encodeKeys(key, sortKey),
    ExpressionAttributeNames: {
      ...generateExpressionAttributeNames(
        'CreatedAt',
        'IsDeleted',
        'ModifiedAt',
        'RawValue',
      ),
      ...generateExpressionAttributeNameIf(
        'DeletedAt',
        options?.deletedAt !== undefined ||
          (options?.isDeleted !== undefined && options.isDeleted),
      ),
      ...generateExpressionAttributeNameIf(
        'TTL',
        options?.timeToLiveInSeconds !== undefined ||
          (options?.upsert !== undefined && options.upsert),
      ),
    },
    ExpressionAttributeValues: {
      ...generateExpressionAttributeValueStrings(
        ['CreatedAt', (options?.createdAt ?? now).toISOString()],
        ['ModifiedAt', (options?.modifiedAt ?? now).toISOString()],
        ['RawValue', JSON.stringify(value)],
      ),
      ...(options?.deletedAt !== undefined
        ? {
            ':DeletedAt': {
              S: options.deletedAt.toISOString(),
            },
          }
        : options?.isDeleted !== undefined && options.isDeleted
        ? {
            ':DeletedAt': {
              S: now.toISOString(),
            },
          }
        : {}),
      ':IsDeleted': {
        BOOL: options?.isDeleted ?? false,
      },
      ...(options?.timeToLiveInSeconds !== undefined
        ? {
            ':TTL': {
              N: `${options.timeToLiveInSeconds + utcSecondsSinceEpoch}`,
            },
          }
        : {}),
    },
    UpdateExpression: `SET #RawValue = :RawValue, #ModifiedAt = :ModifiedAt, #IsDeleted = :IsDeleted, #CreatedAt = ${
      upsert ? ':CreatedAt' : 'if_not_exists(#CreatedAt, :CreatedAt)'
    }${
      options?.isDeleted !== undefined && options.isDeleted
        ? ', #DeletedAt = :DeletedAt'
        : ''
    }${options?.timeToLiveInSeconds !== undefined ? ', #TTL = :TTL' : ''}${
      options?.timeToLiveInSeconds === undefined &&
      options?.upsert !== undefined &&
      options.upsert
        ? ', REMOVE #TTL'
        : ''
    }`,
  }
}

export interface UpdateParams<T extends object> extends DynamoDBParams {
  key: Key
  sortKey?: Key
  value: T
  options?: InsertOrUpdateOptions
}
export async function update<
  TOld extends object = object,
  TNew extends object = object,
>(params: UpdateParams<TNew>): Promise<Entry<TOld> | void> {
  const {client, options} = params
  const response = await client.updateItem(generateUpdate(params))
  return options?.upsert
    ? {
        createdAt: new Date(response.Attributes!.CreatedAt.S!),
        modifiedAt: new Date(response.Attributes!.ModifiedAt.S!),
        isDeleted: response.Attributes!.IsDeleted.BOOL!,
        value: JSON.parse(response.Attributes!.RawValue.S!),
        deletedAt: response.Attributes!.DeletedAt
          ? new Date(response.Attributes!.DeletedAt.S!)
          : undefined,
      }
    : undefined
}
