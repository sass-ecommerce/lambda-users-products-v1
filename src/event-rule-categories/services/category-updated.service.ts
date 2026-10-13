import { CategoryAncestor, CategoryUpdatedDetail } from '../event-bridge.types';
import { updateCategory } from '../repositories/categories.repository';
import {
  listProductCategoryTraces,
  updateProductCategoryTrace,
} from '../repositories/products.repository';

// Returns the trace with the renamed entry, or null when the category isn't in it.
export const renameInTrace = (
  trace: CategoryAncestor[] | undefined,
  detail: Pick<CategoryUpdatedDetail, 'categoryId' | 'name' | 'slug'>,
): CategoryAncestor[] | null => {
  if (!trace?.some((entry) => entry.id === detail.categoryId)) return null;

  return trace.map((entry) =>
    entry.id === detail.categoryId ? { ...entry, name: detail.name, slug: detail.slug } : entry,
  );
};

export const updateCategoryDetails = async (detail: CategoryUpdatedDetail): Promise<void> => {
  const { tenantId, categoryId, ...fields } = detail;

  await updateCategory(tenantId, categoryId, fields);

  // Products keep a copy of their category chain; rename it there too so the
  // storefront doesn't keep showing the old name on cards and breadcrumbs.
  const products = await listProductCategoryTraces(tenantId);
  const renamed = products.flatMap((product) => {
    const category = renameInTrace(product.category, detail);
    return category ? [{ productId: product.productId, category }] : [];
  });

  await Promise.all(
    renamed.map(({ productId, category }) =>
      updateProductCategoryTrace(tenantId, productId, category),
    ),
  );

  console.log(
    JSON.stringify({
      message: 'updateCategoryDetails',
      categoryId,
      productsUpdated: renamed.length,
    }),
  );
};
