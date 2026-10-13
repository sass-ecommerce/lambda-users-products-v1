import { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { CategoryListResult, StoreCategory } from '../get-dynamodb-categories.types';
import { queryAllCategoriesByTenant } from '../repositories/categories.repository';

// The storefront only shows categories with active products, so shoppers never
// pick a filter that yields zero results. Flat list; the client builds the tree
// from parentId.
export const toStoreCategories = (items: Record<string, NativeAttributeValue>[]): StoreCategory[] =>
  items
    .filter((item) => ((item.productCount as number | undefined) ?? 0) > 0)
    .map((item) => ({
      categoryId: item.categoryId as string,
      parentId: (item.parentId as string | null | undefined) ?? null,
      type: item.type as StoreCategory['type'],
      name: item.name as string,
      slug: item.slug as string,
      productCount: item.productCount as number,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

export const listCategories = async (tenantId: string): Promise<CategoryListResult> => ({
  items: toStoreCategories(await queryAllCategoriesByTenant(tenantId)),
});
