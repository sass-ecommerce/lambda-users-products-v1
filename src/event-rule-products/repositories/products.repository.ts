import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ProductCreatedDetail, ProductImage, ProductUpdatedDetail } from '../event-bridge.types';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_PRODUCTS!;

export const putProduct = async (detail: ProductCreatedDetail): Promise<void> => {
  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...detail,
        images: [],
        createdAt: new Date().toISOString(),
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
      ExpressionAttributeNames: Object.fromEntries(entries.map(([key], index) => [`#field${index}`, key])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], index) => [`:value${index}`, value])),
    }),
  );
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
