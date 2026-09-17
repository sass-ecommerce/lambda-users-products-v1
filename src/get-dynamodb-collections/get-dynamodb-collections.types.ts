export interface CollectionListResult {
  items: Record<string, unknown>[];
  nextToken: string | null;
}

export interface CollectionProductsListResult {
  items: Record<string, unknown>[];
  nextToken: string | null;
}
