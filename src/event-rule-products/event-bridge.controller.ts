import { ProductEvent } from './event-bridge.types';
import { createProduct } from './services/product-created.service';
import { removeProduct } from './services/product-deleted.service';
import { addProductImages } from './services/product-image-added.service';
import { updateProductDetails } from './services/product-updated.service';

export const eventBridgeProducts = async (event: ProductEvent): Promise<void> => {
  console.log(JSON.stringify(event, null, 2));

  switch (event['detail-type']) {
    case 'product.created':
      await createProduct(event.detail);
      break;
    case 'product.image.added':
      await addProductImages(event.detail);
      break;
    case 'product.deleted':
      await removeProduct(event.detail);
      break;
    case 'product.updated':
      await updateProductDetails(event.detail);
      break;
  }
};
