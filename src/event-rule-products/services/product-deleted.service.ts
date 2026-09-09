import { ProductDeletedDetail } from '../event-bridge.types';
import { deleteProduct } from '../repositories/products.repository';

export const removeProduct = async (detail: ProductDeletedDetail): Promise<void> => {
  const { tenantId, productId } = detail;

  await deleteProduct(tenantId, productId);
};
