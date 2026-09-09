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
  basePrice: number;
  isActive: boolean;
  attributes: ProductAttribute[];
}

export interface ProductImage {
  id: string;
  s3Key: string;
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

export type ProductUpdatedDetail = ProductCreatedDetail;

export type ProductEvent =
  | EventBridgeEvent<'product.created', ProductCreatedDetail>
  | EventBridgeEvent<'product.image.added', ProductImageDetail>
  | EventBridgeEvent<'product.deleted', ProductDeletedDetail>
  | EventBridgeEvent<'product.updated', ProductUpdatedDetail>;
