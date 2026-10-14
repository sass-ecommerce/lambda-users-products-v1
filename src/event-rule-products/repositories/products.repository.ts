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

const isConditionalCheckFailed = (error: unknown): boolean =>
  (error as Error).name === 'ConditionalCheckFailedException';

// `#field0 = :value0, …` for the defined fields: DynamoDB rejects undefined values.
const setFields = (fields: Record<string, unknown>) => {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  return {
    assignments: entries.map((_, index) => `#field${index} = :value${index}`),
    names: Object.fromEntries(entries.map(([key], index) => [`#field${index}`, key])),
    values: Object.fromEntries(entries.map(([, value], index) => [`:value${index}`, value])),
  };
};

// Every write from product.created/updated stamps `sourceUpdatedAt` (the
// backend's createdAt/updatedAt) and only applies when it isn't older than the
// one stored, so retried or reordered events never undo a newer edit.
const NOT_OLDER = 'attribute_not_exists(sourceUpdatedAt) OR sourceUpdatedAt <= :version';

// An update rather than a put, so a redelivered product.created never wipes the
// images (and createdAt) that later events already stored. Returns false when a
// newer version is already stored.
export const putProduct = async (detail: ProductCreatedDetail): Promise<boolean> => {
  const { tenantId, productId, createdAt, ...fields } = detail;
  const set = setFields(fields);
  // Older backends send no createdAt: stored unguarded, as before.
  const guarded = createdAt !== undefined;

  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { tenantId, productId },
        UpdateExpression: `SET ${[
          ...set.assignments,
          'images = if_not_exists(images, :images)',
          'createdAt = if_not_exists(createdAt, :createdAt)',
          ...(guarded ? ['sourceUpdatedAt = :version'] : []),
        ].join(', ')}`,
        ...(guarded ? { ConditionExpression: NOT_OLDER } : {}),
        ExpressionAttributeNames: set.names,
        ExpressionAttributeValues: {
          ...set.values,
          ':images': [],
          ':createdAt': createdAt ?? new Date().toISOString(),
          ...(guarded ? { ':version': createdAt } : {}),
        },
      }),
    );
    return true;
  } catch (error) {
    if (isConditionalCheckFailed(error)) return false;
    throw error;
  }
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

// Applies a full snapshot from product.updated. Skips it (returns false) when
// a newer one is already stored, or when the product was deleted meanwhile:
// it never recreates a deleted product.
export const updateProduct = async (
  tenantId: string,
  productId: string,
  fields: Omit<ProductUpdatedDetail, 'tenantId' | 'productId'>,
): Promise<boolean> => {
  const set = setFields(fields);

  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { tenantId, productId },
        UpdateExpression: `SET ${[...set.assignments, 'sourceUpdatedAt = :version'].join(', ')}`,
        ConditionExpression: `attribute_exists(productId) AND (${NOT_OLDER})`,
        ExpressionAttributeNames: set.names,
        ExpressionAttributeValues: { ...set.values, ':version': fields.updatedAt },
      }),
    );
    return true;
  } catch (error) {
    if (isConditionalCheckFailed(error)) return false;
    throw error;
  }
};

// Legacy (product.image.added).
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
