import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { CategoryCreatedDetail, CategoryUpdatedDetail } from '../event-bridge.types';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_CATEGORIES!;

// productCount starts at 0; recalculateCategoryCounts sets the real value
// (non-zero when replaying existing categories through the backfill).
export const putCategory = async (detail: CategoryCreatedDetail): Promise<void> => {
  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...detail,
        productCount: 0,
      },
    }),
  );
};

// Conditional so an update that arrives before its category.created fails and
// is retried by EventBridge, instead of creating a partial item.
export const updateCategory = async (
  tenantId: string,
  categoryId: string,
  fields: Omit<CategoryUpdatedDetail, 'tenantId' | 'categoryId'>,
): Promise<void> => {
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, categoryId },
      UpdateExpression: 'SET #name = :name, slug = :slug, updatedAt = :updatedAt',
      ConditionExpression: 'attribute_exists(categoryId)',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': fields.name,
        ':slug': fields.slug,
        ':updatedAt': fields.updatedAt,
      },
    }),
  );
};

export const deleteCategory = async (tenantId: string, categoryId: string): Promise<void> => {
  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, categoryId },
    }),
  );
};
