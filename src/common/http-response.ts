import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ErrorResponseBody, SuccessResponseBody } from './http-response.types';

export const successResponse = <T>(
  statusCode: number,
  message: string,
  data: T,
): APIGatewayProxyResultV2 => ({
  statusCode,
  body: JSON.stringify({ code: statusCode, message, data } satisfies SuccessResponseBody<T>),
});

export const errorResponse = (
  statusCode: number,
  message: string,
  detail: string,
): APIGatewayProxyResultV2 => ({
  statusCode,
  body: JSON.stringify({
    code: statusCode,
    message,
    error: { detail },
  } satisfies ErrorResponseBody),
});
