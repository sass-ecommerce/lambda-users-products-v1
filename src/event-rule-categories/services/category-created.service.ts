import { recalculateCategoryCounts } from '../../common/category-counts';
import { CategoryCreatedDetail } from '../event-bridge.types';
import { putCategory } from '../repositories/categories.repository';

export const createCategory = async (detail: CategoryCreatedDetail): Promise<void> => {
  await putCategory(detail);
  await recalculateCategoryCounts(detail.tenantId);
};
