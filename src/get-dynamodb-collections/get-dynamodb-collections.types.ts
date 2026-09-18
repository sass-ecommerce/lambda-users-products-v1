export interface CollectionListResult {
  items: Record<string, unknown>[];
  nextToken: string | null;
}
