import { encodeCursor, ExclusiveStartKey } from '../cursor';
import { ProductListResult } from '../get-dynamodb-products.types';
import { queryProductsByTenant } from '../repositories/products.repository';

export const listProducts = async (
  tenantId: string,
  limit: number,
  exclusiveStartKey?: ExclusiveStartKey,
): Promise<ProductListResult> => {
  const { items, lastEvaluatedKey } = await queryProductsByTenant(tenantId, limit, exclusiveStartKey);

  return { items, nextToken: encodeCursor(lastEvaluatedKey) };
};
