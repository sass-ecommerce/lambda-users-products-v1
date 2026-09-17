import { EventBridgeEvent } from 'aws-lambda';

export interface CollectionCreatedDetail {
  collectionId: string;
  tenantId: string;
  name: string;
}

export interface CollectionUpdatedDetail {
  collectionId: string;
  tenantId: string;
  name: string;
  coverImageKey: string | null;
  updatedAt: string;
}

export interface CollectionDeletedDetail {
  collectionId?: string;
  collectionIds?: string[];
  tenantId: string;
  deletedAt: string;
}

export interface CollectionProductsAddedDetail {
  collectionId: string;
  tenantId: string;
  productIds: string[];
  added: number;
}

export interface CollectionProductsRemovedDetail {
  collectionId: string;
  tenantId: string;
  productIds: string[];
  removed: number;
}

export type CollectionEvent =
  | EventBridgeEvent<'collection.created', CollectionCreatedDetail>
  | EventBridgeEvent<'collection.updated', CollectionUpdatedDetail>
  | EventBridgeEvent<'collection.deleted', CollectionDeletedDetail>
  | EventBridgeEvent<'collection.products.added', CollectionProductsAddedDetail>
  | EventBridgeEvent<'collection.products.removed', CollectionProductsRemovedDetail>;
