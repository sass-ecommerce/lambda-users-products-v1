import { APIGatewayProxyEvent, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { dynamodbCategories } from '../../src/get-dynamodb-categories/get-dynamodb-categories.controller';
import { toStoreCategories } from '../../src/get-dynamodb-categories/services/list-categories.service';

const request = (query: Record<string, string> | null) =>
  ({ queryStringParameters: query }) as unknown as APIGatewayProxyEvent;

const call = async (query: Record<string, string> | null) => {
  const result = (await dynamodbCategories(request(query))) as APIGatewayProxyStructuredResultV2;
  return { status: result.statusCode, body: JSON.parse(result.body as string) };
};

describe('toStoreCategories', () => {
  it('keeps only categories with products, sorted by name', () => {
    const items = toStoreCategories([
      { categoryId: 'b', name: 'Zapatos', slug: 'zapatos', type: 'BASE', productCount: 2 },
      { categoryId: 'a', name: 'Árboles', slug: 'arboles', type: 'BASE', productCount: 1 },
      { categoryId: 'c', name: 'Vacía', slug: 'vacia', type: 'BASE', productCount: 0 },
      { categoryId: 'd', name: 'Sin conteo', slug: 'sin-conteo', type: 'BASE' },
    ]);

    expect(items.map((c) => c.name)).toEqual(['Árboles', 'Zapatos']);
    expect(items[0]).toEqual({
      categoryId: 'a',
      parentId: null,
      type: 'BASE',
      name: 'Árboles',
      slug: 'arboles',
      productCount: 1,
    });
  });
});

describe('dynamodbCategories', () => {
  const send = jest.spyOn(DynamoDBDocumentClient.prototype, 'send');

  afterEach(() => send.mockReset());

  it('returns 400 without tenantId', async () => {
    const { status, body } = await call(null);

    expect(status).toBe(400);
    expect(body.error.detail).toMatch(/tenantId/);
    expect(send).not.toHaveBeenCalled();
  });

  it('returns the visible categories for the tenant', async () => {
    send.mockImplementation(async () => ({
      Items: [
        {
          categoryId: 'polos',
          parentId: 'ropa',
          type: 'CHILDREN',
          name: 'Polos',
          slug: 'polos',
          productCount: 3,
        },
      ],
    }));

    const { status, body } = await call({ tenantId: 't1' });

    expect(status).toBe(200);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]).toMatchObject({ categoryId: 'polos', parentId: 'ropa' });
  });
});
