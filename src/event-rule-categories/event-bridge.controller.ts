import { CategoryEvent } from './event-bridge.types';
import { createCategory } from './services/category-created.service';
import { updateCategoryDetails } from './services/category-updated.service';
import { removeCategory } from './services/category-deleted.service';

export const eventBridgeCategories = async (event: CategoryEvent): Promise<void> => {
  console.log(JSON.stringify(event, null, 2));

  switch (event['detail-type']) {
    case 'category.created':
      await createCategory(event.detail);
      break;
    case 'category.updated':
      await updateCategoryDetails(event.detail);
      break;
    case 'category.deleted':
      await removeCategory(event.detail);
      break;
  }
};
