import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ProductCreatedDetail, ProductImage, ProductUpdatedDetail } from '../event-bridge.types';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_PRODUCTS!;

// An update rather than a put, so a redelivered product.created never wipes the
// images (and createdAt) that later events already stored.
export const putProduct = async (detail: ProductCreatedDetail): Promise<void> => {
  const { tenantId, productId, ...fields } = detail;
  const entries = Object.entries(fields);

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, productId },
      UpdateExpression: `SET ${[
        ...entries.map((_, index) => `#field${index} = :value${index}`),
        'images = if_not_exists(images, :images)',
        'createdAt = if_not_exists(createdAt, :createdAt)',
      ].join(', ')}`,
      ExpressionAttributeNames: Object.fromEntries(
        entries.map(([key], index) => [`#field${index}`, key]),
      ),
      ExpressionAttributeValues: {
        ...Object.fromEntries(entries.map(([, value], index) => [`:value${index}`, value])),
        ':images': [],
        ':createdAt': new Date().toISOString(),
      },
    }),
  );
};

export const getProduct = async (tenantId: string, productId: string) => {
  const { Item } = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, productId },
    }),
  );
  return Item;
};

export const deleteProduct = async (tenantId: string, productId: string): Promise<void> => {
  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, productId },
    }),
  );
};

export const updateProduct = async (
  tenantId: string,
  productId: string,
  fields: Omit<ProductUpdatedDetail, 'tenantId' | 'productId'>,
): Promise<void> => {
  const entries = Object.entries({ ...fields, updatedAt: new Date().toISOString() });

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, productId },
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

// Skips snapshots older than the one already stored, and never recreates a
// product that was deleted in the meantime.
export const replaceProductImages = async (
  tenantId: string,
  productId: string,
  images: ProductImage[],
  syncedAt: string,
): Promise<boolean> => {
  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { tenantId, productId },
        UpdateExpression:
          'SET images = :images, imagesSyncedAt = :syncedAt, updatedAt = :updatedAt',
        ConditionExpression:
          'attribute_exists(productId) AND (attribute_not_exists(imagesSyncedAt) OR imagesSyncedAt <= :syncedAt)',
        ExpressionAttributeValues: {
          ':images': images,
          ':syncedAt': syncedAt,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );
    return true;
  } catch (error) {
    if ((error as Error).name === 'ConditionalCheckFailedException') return false;
    throw error;
  }
};

export const updateProductImages = async (
  tenantId: string,
  productId: string,
  images: ProductImage[],
): Promise<void> => {
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tenantId, productId },
      UpdateExpression: 'SET images = :images, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':images': images,
        ':updatedAt': new Date().toISOString(),
      },
    }),
  );
};
