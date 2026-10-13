import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  countActiveProductsByCategory,
  recalculateCategoryCounts,
} from '../../src/common/category-counts';

const ropa = { id: 'ropa' };
const polos = { id: 'polos' };
const calzado = { id: 'calzado' };

describe('countActiveProductsByCategory', () => {
  it('counts each active product in its category and every ancestor', () => {
    const counts = countActiveProductsByCategory([
      { isActive: true, category: [ropa, polos] },
      { isActive: true, category: [ropa] },
      { category: [calzado] }, // isActive missing counts as active
    ]);

    expect(Object.fromEntries(counts)).toEqual({ ropa: 2, polos: 1, calzado: 1 });
  });

  it('ignores inactive products and products without category', () => {
    const counts = countActiveProductsByCategory([
      { isActive: false, category: [ropa, polos] },
      { isActive: true },
    ]);

    expect(counts.size).toBe(0);
  });

  it('counts a product once even if a category id repeats in its trace', () => {
    const counts = countActiveProductsByCategory([{ category: [ropa, ropa] }]);

    expect(counts.get('ropa')).toBe(1);
  });
});

describe('recalculateCategoryCounts', () => {
  const send = jest.spyOn(DynamoDBDocumentClient.prototype, 'send');

  afterEach(() => send.mockReset());

  const mockTables = (products: object[], categories: object[]) => {
    send.mockImplementation(async (command: unknown) => {
      if (command instanceof QueryCommand) {
        const items = command.input.TableName === 'tbl-products-test' ? products : categories;
        return { Items: items };
      }
      return {};
    });
  };

  const updates = () =>
    send.mock.calls
      .map(([command]) => command as unknown)
      .filter((command): command is UpdateCommand => command instanceof UpdateCommand)
      .map((command) => ({
        categoryId: command.input.Key?.categoryId,
        count: command.input.ExpressionAttributeValues?.[':count'],
      }));

  it('writes only the categories whose count changed', async () => {
    mockTables(
      [{ isActive: true, category: [ropa, polos] }],
      [
        { categoryId: 'ropa', productCount: 1 }, // unchanged
        { categoryId: 'polos', productCount: 0 }, // 0 → 1
        { categoryId: 'calzado', productCount: 3 }, // 3 → 0
      ],
    );

    await recalculateCategoryCounts('tenant-1');

    expect(updates()).toEqual([
      { categoryId: 'polos', count: 1 },
      { categoryId: 'calzado', count: 0 },
    ]);
  });

  it('ignores categories deleted while counting', async () => {
    mockTables([{ category: [polos] }], [{ categoryId: 'polos' }]);
    send.mockImplementationOnce(async () => ({ Items: [{ category: [polos] }] }));
    send.mockImplementationOnce(async () => ({ Items: [{ categoryId: 'polos' }] }));
    send.mockImplementationOnce(async () => {
      throw Object.assign(new Error('gone'), { name: 'ConditionalCheckFailedException' });
    });

    await expect(recalculateCategoryCounts('tenant-1')).resolves.toBeUndefined();
  });

  it('reads every page of the tenant partition', async () => {
    send
      .mockImplementationOnce(async () => ({
        Items: [{ category: [polos] }],
        LastEvaluatedKey: { tenantId: 'tenant-1', productId: 'p1' },
      }))
      .mockImplementationOnce(async () => ({ Items: [{ categoryId: 'polos', productCount: 0 }] }))
      .mockImplementationOnce(async () => ({ Items: [{ category: [polos] }] }))
      .mockImplementation(async () => ({}));

    await recalculateCategoryCounts('tenant-1');

    expect(updates()).toEqual([{ categoryId: 'polos', count: 2 }]);
  });
});
