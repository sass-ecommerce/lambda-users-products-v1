import { recalculateCategoryCounts } from '../common/category-counts';
import { ProductEvent } from './event-bridge.types';
import { createProduct } from './services/product-created.service';
import { removeProduct } from './services/product-deleted.service';
import { addProductImages } from './services/product-image-added.service';
import { syncProductImages } from './services/product-images-synced.service';
import { updateProductDetails } from './services/product-updated.service';

export const eventBridgeProducts = async (event: ProductEvent): Promise<void> => {
  console.log(JSON.stringify(event, null, 2));

  switch (event['detail-type']) {
    case 'product.created':
      await createProduct(event.detail);
      await recalculateCategoryCounts(event.detail.tenantId);
      break;
    // Legacy: the backend now publishes product.images.synced instead.
    case 'product.image.added':
      await addProductImages(event.detail);
      break;
    case 'product.images.synced':
      await syncProductImages(event.detail);
      break;
    case 'product.deleted':
      await removeProduct(event.detail);
      await recalculateCategoryCounts(event.detail.tenantId);
      break;
    case 'product.updated':
      // May change the category or isActive, both of which affect the counts.
      await updateProductDetails(event.detail);
      await recalculateCategoryCounts(event.detail.tenantId);
      break;
  }
};
