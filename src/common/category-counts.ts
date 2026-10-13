import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  NativeAttributeValue,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

// Shared by event-rule-products and event-rule-categories. Imported directly
// (not re-exported from ./index) so the read-only lambdas don't bundle it.

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = process.env.DYNAMODB_TABLE_PRODUCTS!;
const CATEGORIES_TABLE = process.env.DYNAMODB_TABLE_CATEGORIES!;

type Item = Record<string, NativeAttributeValue>;

export interface CountableProduct {
  isActive?: boolean;
  category?: { id: string }[];
}

// A product's `category` holds its whole ancestor chain (root → leaf), so each
// active product counts towards its category and every ancestor of it.
export const countActiveProductsByCategory = (
  products: CountableProduct[],
): Map<string, number> => {
  const counts = new Map<string, number>();

  for (const product of products) {
    if (product.isActive === false) continue;

    const categoryIds = new Set((product.category ?? []).map((c) => c.id));
    for (const id of categoryIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return counts;
};

export const queryAllByTenant = async (
  tableName: string,
  tenantId: string,
  attributes: string[],
): Promise<Item[]> => {
  const items: Item[] = [];
  let exclusiveStartKey: Item | undefined;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: { ':tenantId': tenantId },
        ProjectionExpression: attributes.map((_, index) => `#attr${index}`).join(', '),
        ExpressionAttributeNames: Object.fromEntries(
          attributes.map((name, index) => [`#attr${index}`, name]),
        ),
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    items.push(...(result.Items ?? []));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
};

// Recomputes every category's productCount for the tenant from the products
// table instead of incrementing/decrementing, so the result stays correct even
// when EventBridge delivers events out of order or more than once.
export const recalculateCategoryCounts = async (tenantId: string): Promise<void> => {
  const [products, categories] = await Promise.all([
    queryAllByTenant(PRODUCTS_TABLE, tenantId, ['isActive', 'category']),
    queryAllByTenant(CATEGORIES_TABLE, tenantId, ['categoryId', 'productCount']),
  ]);

  const counts = countActiveProductsByCategory(products as CountableProduct[]);

  const changed = categories
    .map((category) => ({
      categoryId: category.categoryId as string,
      current: (category.productCount as number | undefined) ?? 0,
      next: counts.get(category.categoryId as string) ?? 0,
    }))
    .filter(({ current, next }) => current !== next);

  await Promise.all(
    changed.map(({ categoryId, next }) =>
      dynamo
        .send(
          new UpdateCommand({
            TableName: CATEGORIES_TABLE,
            Key: { tenantId, categoryId },
            UpdateExpression: 'SET productCount = :count',
            // Never recreate a category deleted while we were counting.
            ConditionExpression: 'attribute_exists(categoryId)',
            ExpressionAttributeValues: { ':count': next },
          }),
        )
        .catch((error: Error) => {
          if (error.name === 'ConditionalCheckFailedException') return;
          throw error;
        }),
    ),
  );

  console.log(
    JSON.stringify({ message: 'recalculateCategoryCounts', tenantId, updated: changed.length }),
  );
};
