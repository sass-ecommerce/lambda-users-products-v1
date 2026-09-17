import { CollectionCreatedDetail } from '../event-bridge.types';
import { putCollection } from '../repositories/collections.repository';

export const createCollection = async (detail: CollectionCreatedDetail): Promise<void> => {
  await putCollection(detail);
};
