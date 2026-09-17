import { CollectionDeletedDetail } from '../event-bridge.types';
import { deleteCollection } from '../repositories/collections.repository';

export const removeCollection = async (detail: CollectionDeletedDetail): Promise<void> => {
  const { tenantId, collectionId, collectionIds } = detail;

  if (collectionIds) {
    await Promise.all(collectionIds.map((id) => deleteCollection(tenantId, id)));
    return;
  }

  await deleteCollection(tenantId, collectionId!);
};
