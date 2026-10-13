import { APIGatewayProxyEvent, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { errorResponse, successResponse } from '../common';
import { listCategories } from './services/list-categories.service';

export const dynamodbCategories = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const tenantId = event.queryStringParameters?.tenantId;

  if (!tenantId) {
    return errorResponse(400, 'Bad Request', 'Provide tenantId as query parameter');
  }

  const result = await listCategories(tenantId);
  return successResponse(200, 'Categories retrieved successfully', result);
};
