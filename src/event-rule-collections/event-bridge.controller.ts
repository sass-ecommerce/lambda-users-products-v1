import { CollectionEvent } from './event-bridge.types';
import { createCollection } from './services/collection-created.service';
import { updateCollectionDetails } from './services/collection-updated.service';
import { removeCollection } from './services/collection-deleted.service';
import { addCollectionProducts } from './services/collection-products-added.service';
import { removeCollectionProducts } from './services/collection-products-removed.service';

export const eventBridgeCollections = async (event: CollectionEvent): Promise<void> => {
  console.log(JSON.stringify(event, null, 2));

  switch (event['detail-type']) {
    case 'collection.created':
      await createCollection(event.detail);
      break;
    case 'collection.updated':
      await updateCollectionDetails(event.detail);
      break;
    case 'collection.deleted':
      await removeCollection(event.detail);
      break;
    case 'collection.products.added':
      await addCollectionProducts(event.detail);
      break;
    case 'collection.products.removed':
      await removeCollectionProducts(event.detail);
      break;
  }
};
