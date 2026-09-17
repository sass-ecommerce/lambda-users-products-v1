import type { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';

export type ExclusiveStartKey = Record<string, NativeAttributeValue>;

export const encodeCursor = (value?: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  return Buffer.from(JSON.stringify(value)).toString('base64url');
};

export const decodeCursor = <T>(token?: string): T | undefined => {
  if (!token) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')) as T;
  } catch {
    throw new Error('Invalid nextToken');
  }
};
