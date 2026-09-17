import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { CollectionCreatedDetail, CollectionUpdatedDetail } from '../event-bridge.types';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_COLLECTIONS!;

export const putCollection = async (detail: CollectionCreatedDetail): Promise<void> => {
  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...detail,
        productIds: [],
        createdAt: new Date().toISOString(),
      },
    }),
  );
};

export const getCollection = async (tenantId: string, collectionId: string) => {
  const { Item } = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, collectionId },
    }),
  );
  return Item;
};

export const deleteCollection = async (tenantId: string, collectionId: string): Promise<void> => {
  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, collectionId },
    }),
  );
};

export const updateCollection = async (
  tenantId: string,
  collectionId: string,
  fields: Omit<CollectionUpdatedDetail, 'tenantId' | 'collectionId'>,
): Promise<void> => {
  const entries = Object.entries({ ...fields, updatedAt: new Date().toISOString() });

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, collectionId },
      UpdateExpression: `SET ${entries.map((_, index) => `#field${index} = :value${index}`).join(', ')}`,
      ExpressionAttributeNames: Object.fromEntries(
        entries.map(([key], index) => [`#field${index}`, key]),
      ),
      ExpressionAttributeValues: Object.fromEntries(
        entries.map(([, value], index) => [`:value${index}`, value]),
      ),
    }),
  );
};

export const updateCollectionProducts = async (
  tenantId: string,
  collectionId: string,
  productIds: string[],
): Promise<void> => {
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, collectionId },
      UpdateExpression: 'SET productIds = :productIds, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':productIds': productIds,
        ':updatedAt': new Date().toISOString(),
      },
    }),
  );
};
