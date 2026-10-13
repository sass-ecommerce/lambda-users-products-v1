import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, NativeAttributeValue, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_CATEGORIES!;

// A store has a handful of categories, so the whole partition is read at once.
export const queryAllCategoriesByTenant = async (
  tenantId: string,
): Promise<Record<string, NativeAttributeValue>[]> => {
  const items: Record<string, NativeAttributeValue>[] = [];
  let exclusiveStartKey: Record<string, NativeAttributeValue> | undefined;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: { ':tenantId': tenantId },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    items.push(...(result.Items ?? []));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
};
