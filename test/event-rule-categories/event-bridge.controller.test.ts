import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { eventBridgeCategories } from '../../src/event-rule-categories/event-bridge.controller';
import { CategoryEvent } from '../../src/event-rule-categories/event-bridge.types';
import { renameInTrace } from '../../src/event-rule-categories/services/category-updated.service';
import { createCategory } from '../../src/event-rule-categories/services/category-created.service';
import { removeCategory } from '../../src/event-rule-categories/services/category-deleted.service';

jest.mock('../../src/event-rule-categories/services/category-created.service');
jest.mock('../../src/event-rule-categories/services/category-deleted.service');

const ropa = { id: 'ropa', parentId: null, name: 'Ropa', slug: 'ropa' };
const polos = { id: 'polos', parentId: 'ropa', name: 'Polos', slug: 'polos' };

const event = (detailType: string, detail: object) =>
  ({ 'detail-type': detailType, detail }) as unknown as CategoryEvent;

describe('eventBridgeCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('routes category.created and category.deleted to their services', async () => {
    const created = { categoryId: 'polos', tenantId: 't1', name: 'Polos' };
    const deleted = { categoryId: 'polos', tenantId: 't1' };

    await eventBridgeCategories(event('category.created', created));
    await eventBridgeCategories(event('category.deleted', deleted));

    expect(createCategory).toHaveBeenCalledWith(created);
    expect(removeCategory).toHaveBeenCalledWith(deleted);
  });

  it('ignores unknown detail types', async () => {
    await eventBridgeCategories(event('category.moved', {}));

    expect(createCategory).not.toHaveBeenCalled();
    expect(removeCategory).not.toHaveBeenCalled();
  });
});

describe('renameInTrace', () => {
  const rename = { categoryId: 'polos', name: 'Camisetas', slug: 'camisetas' };

  it('replaces only the renamed entry, keeping the chain order', () => {
    expect(renameInTrace([ropa, polos], rename)).toEqual([
      ropa,
      { ...polos, name: 'Camisetas', slug: 'camisetas' },
    ]);
  });

  it('returns null when the product is not in that category', () => {
    expect(renameInTrace([ropa], rename)).toBeNull();
    expect(renameInTrace(undefined, rename)).toBeNull();
  });
});

describe('category.updated', () => {
  const send = jest.spyOn(DynamoDBDocumentClient.prototype, 'send');

  afterEach(() => send.mockReset());

  it('renames the category and the copy inside affected products only', async () => {
    send.mockImplementation(async (command: unknown) => {
      if (command instanceof UpdateCommand) return {};
      return {
        Items: [
          { productId: 'p1', category: [ropa, polos] },
          { productId: 'p2', category: [ropa] },
        ],
      };
    });

    await eventBridgeCategories(
      event('category.updated', {
        categoryId: 'polos',
        tenantId: 't1',
        name: 'Camisetas',
        slug: 'camisetas',
        updatedAt: '2026-10-13T00:00:00.000Z',
      }),
    );

    const updates = send.mock.calls
      .map(([command]) => command as unknown)
      .filter((command): command is UpdateCommand => command instanceof UpdateCommand);

    expect(updates.map((u) => u.input.TableName)).toEqual([
      'tbl-categories-test',
      'tbl-products-test',
    ]);
    expect(updates[1].input.Key).toEqual({ tenantId: 't1', productId: 'p1' });
    expect(updates[1].input.ExpressionAttributeValues?.[':category']).toEqual([
      ropa,
      { ...polos, name: 'Camisetas', slug: 'camisetas' },
    ]);
  });
});
