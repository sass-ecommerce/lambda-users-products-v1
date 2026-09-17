import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ExclusiveStartKey } from '../../common';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_COLLECTIONS!;

export const getCollectionById = async (tenantId: string, collectionId: string) => {
  const { Item } = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, collectionId },
    }),
  );

  return Item;
};

export const queryCollectionsByTenant = async (
  tenantId: string,
  limit: number,
  exclusiveStartKey?: ExclusiveStartKey,
) => {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'tenantId = :tenantId',
      ExpressionAttributeValues: { ':tenantId': tenantId },
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
    }),
  );

  return { items: result.Items ?? [], lastEvaluatedKey: result.LastEvaluatedKey };
};
