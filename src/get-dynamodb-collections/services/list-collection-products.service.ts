import { encodeCursor } from '../../common';
import { CollectionProductsListResult } from '../get-dynamodb-collections.types';
import { getCollectionById } from '../repositories/collections.repository';
import { batchGetProductsByIds } from '../repositories/products.repository';

export const listCollectionProducts = async (
  tenantId: string,
  collectionId: string,
  limit: number,
  offset: number,
): Promise<CollectionProductsListResult | null> => {
  const collection = await getCollectionById(tenantId, collectionId);

  if (!collection) {
    return null;
  }

  const productIds = (collection.productIds ?? []) as string[];
  const page = productIds.slice(offset, offset + limit);
  const items = await batchGetProductsByIds(tenantId, page);

  const nextOffset = offset + limit;
  const nextToken = nextOffset < productIds.length ? encodeCursor({ offset: nextOffset }) : null;

  return { items, nextToken };
};
