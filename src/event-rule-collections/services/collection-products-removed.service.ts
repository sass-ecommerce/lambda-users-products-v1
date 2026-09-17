import { CollectionProductsRemovedDetail } from '../event-bridge.types';
import { getCollection, updateCollectionProducts } from '../repositories/collections.repository';

export const removeCollectionProducts = async (
  detail: CollectionProductsRemovedDetail,
): Promise<void> => {
  console.log(JSON.stringify({ message: 'removeCollectionProducts', detail }));
  const { tenantId, collectionId, productIds } = detail;

  const collection = await getCollection(tenantId, collectionId);

  if (!collection) {
    console.log(JSON.stringify({ message: 'collection not found', tenantId, collectionId }));
    return;
  }

  const existingProductIds: string[] = collection.productIds ?? [];
  const remainingProductIds = existingProductIds.filter((id) => !productIds.includes(id));

  await updateCollectionProducts(tenantId, collectionId, remainingProductIds);
};
