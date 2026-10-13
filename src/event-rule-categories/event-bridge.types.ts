import { EventBridgeEvent } from 'aws-lambda';

export interface CategoryCreatedDetail {
  categoryId: string;
  tenantId: string;
  parentId: string | null;
  type: 'BASE' | 'CHILDREN';
  name: string;
  slug: string;
  createdAt: string;
}

export interface CategoryUpdatedDetail {
  categoryId: string;
  tenantId: string;
  name: string;
  slug: string;
  updatedAt: string;
}

export interface CategoryDeletedDetail {
  categoryId: string;
  tenantId: string;
}

// Entry of a product's `category` ancestor chain, as stored in the products table.
export interface CategoryAncestor {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
}

export type CategoryEvent =
  | EventBridgeEvent<'category.created', CategoryCreatedDetail>
  | EventBridgeEvent<'category.updated', CategoryUpdatedDetail>
  | EventBridgeEvent<'category.deleted', CategoryDeletedDetail>;
