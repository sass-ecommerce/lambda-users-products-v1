import { encodeCursor, ExclusiveStartKey } from '../../common';
import { CollectionListResult } from '../get-dynamodb-collections.types';
import { queryCollectionsByTenant } from '../repositories/collections.repository';

export const listCollections = async (
  tenantId: string,
  limit: number,
  exclusiveStartKey?: ExclusiveStartKey,
): Promise<CollectionListResult> => {
  const { items, lastEvaluatedKey } = await queryCollectionsByTenant(
    tenantId,
    limit,
    exclusiveStartKey,
  );

  const sanitizedItems = items.map(({ productIds, ...item }) => ({
    ...item,
    productCount: ((productIds as string[]) ?? []).length,
  }));

  return { items: sanitizedItems, nextToken: encodeCursor(lastEvaluatedKey) };
};
