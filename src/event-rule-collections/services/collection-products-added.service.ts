import { CollectionProductsAddedDetail } from '../event-bridge.types';
import { getCollection, updateCollectionProducts } from '../repositories/collections.repository';

export const addCollectionProducts = async (
  detail: CollectionProductsAddedDetail,
): Promise<void> => {
  console.log(JSON.stringify({ message: 'addCollectionProducts', detail }));
  const { tenantId, collectionId, productIds } = detail;

  const collection = await getCollection(tenantId, collectionId);

  if (!collection) {
    console.log(JSON.stringify({ message: 'collection not found', tenantId, collectionId }));
    return;
  }

  const existingProductIds: string[] = collection.productIds ?? [];
  const mergedProductIds = [...new Set([...existingProductIds, ...productIds])];

  await updateCollectionProducts(tenantId, collectionId, mergedProductIds);
};
