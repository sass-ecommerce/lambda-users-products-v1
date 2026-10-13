import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { queryAllByTenant } from '../../common/category-counts';
import { CategoryAncestor } from '../event-bridge.types';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_PRODUCTS!;

export interface ProductCategoryTrace {
  productId: string;
  category?: CategoryAncestor[];
}

export const listProductCategoryTraces = async (
  tenantId: string,
): Promise<ProductCategoryTrace[]> =>
  (await queryAllByTenant(TABLE_NAME, tenantId, [
    'productId',
    'category',
  ])) as ProductCategoryTrace[];

export const updateProductCategoryTrace = async (
  tenantId: string,
  productId: string,
  category: CategoryAncestor[],
): Promise<void> => {
  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { tenantId, productId },
        UpdateExpression: 'SET #category = :category',
        // Never recreate a product deleted while the rename was running.
        ConditionExpression: 'attribute_exists(productId)',
        ExpressionAttributeNames: { '#category': 'category' },
        ExpressionAttributeValues: { ':category': category },
      }),
    );
  } catch (error) {
    if ((error as Error).name !== 'ConditionalCheckFailedException') throw error;
  }
};
