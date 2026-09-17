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

  return { items, nextToken: encodeCursor(lastEvaluatedKey) };
};
