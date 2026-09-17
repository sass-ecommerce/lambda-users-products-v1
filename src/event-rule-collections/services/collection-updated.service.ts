import { CollectionUpdatedDetail } from '../event-bridge.types';
import { updateCollection } from '../repositories/collections.repository';

export const updateCollectionDetails = async (detail: CollectionUpdatedDetail): Promise<void> => {
  const { tenantId, collectionId, ...fields } = detail;

  await updateCollection(tenantId, collectionId, fields);
};
