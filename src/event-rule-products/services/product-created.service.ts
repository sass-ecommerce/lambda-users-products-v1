import { ProductCreatedDetail } from '../event-bridge.types';
import { putProduct } from '../repositories/products.repository';

export const createProduct = async (detail: ProductCreatedDetail): Promise<void> => {
  const applied = await putProduct(detail);
  if (!applied) {
    console.log(
      JSON.stringify({
        message: 'createProduct skipped (a newer version is already stored)',
        tenantId: detail.tenantId,
        productId: detail.productId,
        createdAt: detail.createdAt,
      }),
    );
  }
};
