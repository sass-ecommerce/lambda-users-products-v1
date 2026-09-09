import { ProductImage, ProductImageDetail } from '../event-bridge.types';
import { getProduct, updateProductImages } from '../repositories/products.repository';

export const addProductImages = async (detail: ProductImageDetail): Promise<void> => {
  console.log(JSON.stringify({ message: 'addProductImages', detail }));
  const { tenantId, images, productId } = detail;

  const product = await getProduct(tenantId, productId);

  if (!product) {
    console.log(JSON.stringify({ message: 'product not found', tenantId, productId }));
    return;
  }

  const existingImages: ProductImage[] = product.images ?? [];
  const mergedImages = [...existingImages, ...images];

  await updateProductImages(tenantId, productId, mergedImages);
};
