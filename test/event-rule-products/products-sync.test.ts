import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { createProduct } from '../../src/event-rule-products/services/product-created.service';
import { updateProductDetails } from '../../src/event-rule-products/services/product-updated.service';
import {
  ProductCreatedDetail,
  ProductUpdatedDetail,
} from '../../src/event-rule-products/event-bridge.types';

const send = jest.spyOn(DynamoDBDocumentClient.prototype, 'send');

const conditionalCheckFailed = () =>
  Object.assign(new Error('conditional'), { name: 'ConditionalCheckFailedException' });

const lastCommand = () => (send.mock.calls[send.mock.calls.length - 1][0] as UpdateCommand).input;

// Value written to `field` by a `#fieldN = :valueN` assignment.
const valueOf = (field: string) => {
  const { ExpressionAttributeNames, ExpressionAttributeValues } = lastCommand();
  const entry = Object.entries(ExpressionAttributeNames!).find(([, name]) => name === field);
  return entry ? ExpressionAttributeValues![entry[0].replace('#field', ':value')] : undefined;
};

const image = (id: string, isPrimary: boolean, sortOrder: number) => ({
  id,
  s3Key: `t1/products/p1/${id}.jpg`,
  url: `https://cdn.test/t1/products/p1/${id}.jpg`,
  isPrimary,
  sortOrder,
});

const created: ProductCreatedDetail = {
  productId: 'p1',
  tenantId: 't1',
  categoryId: 'c1',
  category: [],
  name: 'Polo',
  description: null,
  basePrice: 45,
  isActive: true,
  attributes: [],
  createdAt: '2026-10-13T10:00:00.000Z',
};

const updated: ProductUpdatedDetail = {
  productId: 'p1',
  tenantId: 't1',
  categoryId: 'c1',
  name: 'Polo',
  description: 'Algodón 100%',
  basePrice: 45,
  isActive: true,
  attributes: [],
  images: [image('b', true, 0), image('a', false, 1)],
  updatedAt: '2026-10-13T10:05:00.000Z',
};

beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
afterEach(() => send.mockReset());

describe('product.created', () => {
  it('keeps images and createdAt already stored, and is guarded by its createdAt', async () => {
    send.mockResolvedValue({} as never);

    await createProduct(created);

    const input = lastCommand();
    expect(input.Key).toEqual({ tenantId: 't1', productId: 'p1' });
    expect(input.UpdateExpression).toContain('images = if_not_exists(images, :images)');
    expect(input.UpdateExpression).toContain('createdAt = if_not_exists(createdAt, :createdAt)');
    expect(input.UpdateExpression).toContain('sourceUpdatedAt = :version');
    expect(input.ConditionExpression).toContain('sourceUpdatedAt <= :version');
    expect(input.ExpressionAttributeValues).toMatchObject({
      ':version': created.createdAt,
      ':createdAt': created.createdAt,
    });
    expect(Object.values(input.ExpressionAttributeNames!)).not.toContain('productId');
  });

  it('is skipped when the product already has a newer edit', async () => {
    send.mockRejectedValue(conditionalCheckFailed() as never);

    await expect(createProduct(created)).resolves.toBeUndefined();
  });

  it('stays unguarded for events from older backends (no createdAt)', async () => {
    send.mockResolvedValue({} as never);

    await createProduct({ ...created, createdAt: undefined });

    expect(lastCommand().ConditionExpression).toBeUndefined();
    expect(lastCommand().UpdateExpression).not.toContain('sourceUpdatedAt');
  });
});

describe('product.updated', () => {
  it('stores the full snapshot with its images, a new description and emptied attributes', async () => {
    send.mockResolvedValue({} as never);

    await updateProductDetails(updated);

    expect(valueOf('images')).toEqual(updated.images);
    expect(valueOf('description')).toBe('Algodón 100%');
    expect(valueOf('attributes')).toEqual([]);
    expect(valueOf('updatedAt')).toBe(updated.updatedAt);
    expect(lastCommand().ExpressionAttributeValues![':version']).toBe(updated.updatedAt);
  });

  it('never recreates a deleted product and never applies an older snapshot', async () => {
    send.mockResolvedValue({} as never);

    await updateProductDetails(updated);

    expect(lastCommand().ConditionExpression).toBe(
      'attribute_exists(productId) AND (attribute_not_exists(sourceUpdatedAt) OR sourceUpdatedAt <= :version)',
    );
  });

  it('skips stale or deleted without failing', async () => {
    send.mockRejectedValue(conditionalCheckFailed() as never);

    await expect(updateProductDetails(updated)).resolves.toBeUndefined();
  });

  it('rethrows other DynamoDB errors so EventBridge retries', async () => {
    send.mockRejectedValue(new Error('throttled') as never);

    await expect(updateProductDetails(updated)).rejects.toThrow('throttled');
  });

  it('leaves images untouched for events from older backends (no images)', async () => {
    send.mockResolvedValue({} as never);

    await updateProductDetails({ ...updated, images: undefined });

    expect(valueOf('images')).toBeUndefined();
    expect(Object.values(lastCommand().ExpressionAttributeValues!)).not.toContain(undefined);
  });
});
