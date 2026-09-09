import { ProductUpdatedDetail } from '../event-bridge.types';
import { updateProduct } from '../repositories/products.repository';

export const updateProductDetails = async (detail: ProductUpdatedDetail): Promise<void> => {
  const { tenantId, productId, ...fields } = detail;

  await updateProduct(tenantId, productId, fields);
};
