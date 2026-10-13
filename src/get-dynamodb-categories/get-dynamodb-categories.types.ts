export interface StoreCategory {
  categoryId: string;
  parentId: string | null;
  type: 'BASE' | 'CHILDREN';
  name: string;
  slug: string;
  productCount: number;
}

export interface CategoryListResult {
  items: StoreCategory[];
}
