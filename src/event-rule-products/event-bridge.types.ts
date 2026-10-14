import { EventBridgeEvent } from 'aws-lambda';

export interface CategoryAncestor {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  attributeKey: string;
  attributeLabel: string;
  value: string;
}

export interface ProductCreatedDetail {
  productId: string;
  tenantId: string;
  categoryId: string;
  category: CategoryAncestor[];
  name: string;
  description: string | null;
  basePrice: number;
  isActive: boolean;
  attributes: ProductAttribute[];
}

export interface ProductImage {
  id: string;
  s3Key: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductImageDetail {
  tenantId: string;
  productId: string;
  images: ProductImage[];
}

// Full, ordered list of the product's active images (replaces, not appends).
export interface ProductImagesSyncedDetail {
  tenantId: string;
  productId: string;
  syncedAt: string;
  images: ProductImage[];
}

export interface ProductDeletedDetail {
  tenantId: string;
  productId: string;
}

// `category` is only sent when the product changed category.
export interface ProductUpdatedDetail extends Omit<ProductCreatedDetail, 'category'> {
  category?: CategoryAncestor[];
  updatedAt: string;
}

export type ProductEvent =
  | EventBridgeEvent<'product.created', ProductCreatedDetail>
  | EventBridgeEvent<'product.image.added', ProductImageDetail>
  | EventBridgeEvent<'product.images.synced', ProductImagesSyncedDetail>
  | EventBridgeEvent<'product.deleted', ProductDeletedDetail>
  | EventBridgeEvent<'product.updated', ProductUpdatedDetail>;
