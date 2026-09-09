export interface ProductListResult {
  items: Record<string, unknown>[];
  nextToken: string | null;
}
