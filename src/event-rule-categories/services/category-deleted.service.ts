import { CategoryDeletedDetail } from '../event-bridge.types';
import { deleteCategory } from '../repositories/categories.repository';

export const removeCategory = async (detail: CategoryDeletedDetail): Promise<void> => {
  const { tenantId, categoryId } = detail;

  await deleteCategory(tenantId, categoryId);
};
