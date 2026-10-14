import { ProductImagesSyncedDetail } from '../event-bridge.types';
import { replaceProductImages } from '../repositories/products.repository';

export const syncProductImages = async (detail: ProductImagesSyncedDetail): Promise<void> => {
  const { tenantId, productId, images, syncedAt } = detail;

  const applied = await replaceProductImages(tenantId, productId, images, syncedAt);

  console.log(
    JSON.stringify({
      message: applied ? 'syncProductImages' : 'syncProductImages skipped (stale or deleted)',
      tenantId,
      productId,
      count: images.length,
      syncedAt,
    }),
  );
};
