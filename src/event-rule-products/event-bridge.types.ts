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
  // Absent from events published by backends older than the read-model guard.
  createdAt?: string;
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

export interface ProductDeletedDetail {
  tenantId: string;
  productId: string;
}

// A full snapshot of the product; `category` is only sent when it changed.
// `images` (ordered, first = cover) is absent from older backends' events.
export interface ProductUpdatedDetail extends Omit<ProductCreatedDetail, 'category' | 'createdAt'> {
  category?: CategoryAncestor[];
  images?: ProductImage[];
  updatedAt: string;
}

export type ProductEvent =
  | EventBridgeEvent<'product.created', ProductCreatedDetail>
  | EventBridgeEvent<'product.image.added', ProductImageDetail>
  | EventBridgeEvent<'product.deleted', ProductDeletedDetail>
  | EventBridgeEvent<'product.updated', ProductUpdatedDetail>;
