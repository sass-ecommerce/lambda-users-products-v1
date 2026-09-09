import { ProductCreatedDetail } from '../event-bridge.types';
import { putProduct } from '../repositories/products.repository';

export const createProduct = async (detail: ProductCreatedDetail): Promise<void> => {
  await putProduct(detail);
};
