import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { errorResponse, successResponse } from '../common';
import { decodeCursor } from './cursor';
import { getProductById } from './repositories/products.repository';
import { listProducts } from './services/list-products.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parseLimit = (raw?: string): number | null => {
  if (!raw) {
    return DEFAULT_LIMIT;
  }

  const limit = Number(raw);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return null;
  }

  return limit;
};

export const dynamodbProducts = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const id = event.pathParameters?.id;
  const tenantId = event.queryStringParameters?.tenantId;

  if (!tenantId) {
    return errorResponse(400, 'Bad Request', 'Provide tenantId as query parameter');
  }

  if (id) {
    const item = await getProductById(tenantId, id);

    if (!item) {
      return errorResponse(404, 'Not Found', 'Product not found');
    }

    return successResponse(200, 'Product retrieved successfully', item);
  }

  const limit = parseLimit(event.queryStringParameters?.limit);

  if (limit === null) {
    return errorResponse(400, 'Bad Request', `limit must be an integer between 1 and ${MAX_LIMIT}`);
  }

  let exclusiveStartKey;
  try {
    exclusiveStartKey = decodeCursor(event.queryStringParameters?.nextToken);
  } catch {
    return errorResponse(400, 'Bad Request', 'Invalid nextToken');
  }

  const result = await listProducts(tenantId, limit, exclusiveStartKey);
  return successResponse(200, 'Products retrieved successfully', result);
};
