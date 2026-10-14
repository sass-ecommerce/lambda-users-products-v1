import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { syncProductImages } from '../../src/event-rule-products/services/product-images-synced.service';
import { createProduct } from '../../src/event-rule-products/services/product-created.service';
import { updateProductDetails } from '../../src/event-rule-products/services/product-updated.service';

const send = jest.spyOn(DynamoDBDocumentClient.prototype, 'send');

const image = (id: string, isPrimary: boolean, sortOrder: number) => ({
  id,
  s3Key: `t1/products/p1/${id}.jpg`,
  url: `https://cdn.test/t1/products/p1/${id}.jpg`,
  isPrimary,
  sortOrder,
});

describe('product.images.synced', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
  afterEach(() => send.mockReset());

  it('replaces the whole image list, guarded by syncedAt and product existence', async () => {
    send.mockResolvedValue({} as never);
    const images = [image('b', true, 0), image('a', false, 1)];

    await syncProductImages({
      tenantId: 't1',
      productId: 'p1',
      syncedAt: '2026-10-13T10:00:00.000Z',
      images,
    });

    const command = send.mock.calls[0][0] as UpdateCommand;
    expect(command.input.Key).toEqual({ tenantId: 't1', productId: 'p1' });
    expect(command.input.UpdateExpression).toContain('SET images = :images');
    expect(command.input.ConditionExpression).toContain('attribute_exists(productId)');
    expect(command.input.ConditionExpression).toContain('imagesSyncedAt <= :syncedAt');
    expect(command.input.ExpressionAttributeValues).toMatchObject({
      ':images': images,
      ':syncedAt': '2026-10-13T10:00:00.000Z',
    });
  });

  it('skips stale snapshots or deleted products without failing', async () => {
    send.mockRejectedValue(
      Object.assign(new Error('conditional'), { name: 'ConditionalCheckFailedException' }) as never,
    );

    await expect(
      syncProductImages({
        tenantId: 't1',
        productId: 'p1',
        syncedAt: '2026-10-13T09:00:00.000Z',
        images: [],
      }),
    ).resolves.toBeUndefined();
  });

  it('rethrows other DynamoDB errors so EventBridge retries', async () => {
    send.mockRejectedValue(new Error('throttled') as never);

    await expect(
      syncProductImages({
        tenantId: 't1',
        productId: 'p1',
        syncedAt: '2026-10-13T09:00:00.000Z',
        images: [],
      }),
    ).rejects.toThrow('throttled');
  });
});

describe('product.created', () => {
  afterEach(() => send.mockReset());

  it('keeps images and createdAt already stored when the event is redelivered', async () => {
    send.mockResolvedValue({} as never);

    await createProduct({
      productId: 'p1',
      tenantId: 't1',
      categoryId: 'c1',
      category: [],
      name: 'Polo',
      description: null,
      basePrice: 45,
      isActive: true,
      attributes: [],
    });

    const command = send.mock.calls[0][0] as UpdateCommand;
    expect(command.input.Key).toEqual({ tenantId: 't1', productId: 'p1' });
    expect(command.input.UpdateExpression).toContain('images = if_not_exists(images, :images)');
    expect(command.input.UpdateExpression).toContain(
      'createdAt = if_not_exists(createdAt, :createdAt)',
    );
    expect(Object.values(command.input.ExpressionAttributeNames!)).not.toContain('productId');
  });
});

describe('product.updated', () => {
  afterEach(() => send.mockReset());

  it('stores a description added later and an emptied attribute list', async () => {
    send.mockResolvedValue({} as never);

    await updateProductDetails({
      productId: 'p1',
      tenantId: 't1',
      categoryId: 'c1',
      name: 'Polo',
      description: 'Algodón 100%',
      basePrice: 45,
      isActive: true,
      attributes: [],
      updatedAt: '2026-10-13T10:00:00.000Z',
    });

    const { ExpressionAttributeNames, ExpressionAttributeValues } = (
      send.mock.calls[0][0] as UpdateCommand
    ).input;
    const valueOf = (field: string) => {
      const [placeholder] = Object.entries(ExpressionAttributeNames!).find(
        ([, name]) => name === field,
      )!;
      return ExpressionAttributeValues![placeholder.replace('#field', ':value')];
    };
    expect(valueOf('description')).toBe('Algodón 100%');
    expect(valueOf('attributes')).toEqual([]);
  });
});
