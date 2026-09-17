import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { decodeCursor, errorResponse, ExclusiveStartKey, successResponse } from '../common';
import { getCollectionById } from './repositories/collections.repository';
import { listCollectionProducts } from './services/list-collection-products.service';
import { listCollections } from './services/list-collections.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface OffsetCursor {
  offset: number;
}

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

export const dynamodbCollections = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const tenantId = event.queryStringParameters?.tenantId;

  if (!tenantId) {
    return errorResponse(400, 'Bad Request', 'Provide tenantId as query parameter');
  }

  const collectionIdForProducts = event.pathParameters?.collectionId;
  const collectionId = event.pathParameters?.id;

  const limit = parseLimit(event.queryStringParameters?.limit);

  if (limit === null) {
    return errorResponse(400, 'Bad Request', `limit must be an integer between 1 and ${MAX_LIMIT}`);
  }

  if (collectionIdForProducts) {
    let offsetCursor: OffsetCursor | undefined;
    try {
      offsetCursor = decodeCursor<OffsetCursor>(event.queryStringParameters?.nextToken);
    } catch {
      return errorResponse(400, 'Bad Request', 'Invalid nextToken');
    }

    const result = await listCollectionProducts(
      tenantId,
      collectionIdForProducts,
      limit,
      offsetCursor?.offset ?? 0,
    );

    if (!result) {
      return errorResponse(404, 'Not Found', 'Collection not found');
    }

    return successResponse(200, 'Collection products retrieved successfully', result);
  }

  if (collectionId) {
    const item = await getCollectionById(tenantId, collectionId);

    if (!item) {
      return errorResponse(404, 'Not Found', 'Collection not found');
    }

    return successResponse(200, 'Collection retrieved successfully', item);
  }

  let exclusiveStartKey: ExclusiveStartKey | undefined;
  try {
    exclusiveStartKey = decodeCursor<ExclusiveStartKey>(event.queryStringParameters?.nextToken);
  } catch {
    return errorResponse(400, 'Bad Request', 'Invalid nextToken');
  }

  const result = await listCollections(tenantId, limit, exclusiveStartKey);
  return successResponse(200, 'Collections retrieved successfully', result);
};
