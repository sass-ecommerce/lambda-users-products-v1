import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchGetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_PRODUCTS!;

export const batchGetProductsByIds = async (
  tenantId: string,
  productIds: string[],
): Promise<Record<string, unknown>[]> => {
  if (productIds.length === 0) {
    return [];
  }

  const { Responses } = await dynamo.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: productIds.map((productId) => ({ tenantId, productId })),
        },
      },
    }),
  );

  const itemsById = new Map(
    (Responses?.[TABLE_NAME] ?? []).map((item) => [item.productId as string, item]),
  );

  return productIds.reduce<Record<string, unknown>[]>((items, productId) => {
    const item = itemsById.get(productId);

    if (item) {
      items.push(item);
    }

    return items;
  }, []);
};
