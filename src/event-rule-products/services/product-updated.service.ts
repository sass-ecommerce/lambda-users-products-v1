import { ProductUpdatedDetail } from '../event-bridge.types';
import { updateProduct } from '../repositories/products.repository';

export const updateProductDetails = async (detail: ProductUpdatedDetail): Promise<void> => {
  const { tenantId, productId, ...fields } = detail;

  const applied = await updateProduct(tenantId, productId, fields);
  if (!applied) {
    console.log(
      JSON.stringify({
        message: 'updateProductDetails skipped (stale or deleted)',
        tenantId,
        productId,
        updatedAt: detail.updatedAt,
      }),
    );
  }
};
