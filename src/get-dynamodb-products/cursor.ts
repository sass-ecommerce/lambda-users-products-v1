import { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';

export type ExclusiveStartKey = Record<string, NativeAttributeValue>;

export const encodeCursor = (key?: ExclusiveStartKey): string | null => {
  if (!key) {
    return null;
  }

  return Buffer.from(JSON.stringify(key)).toString('base64url');
};

export const decodeCursor = (token?: string): ExclusiveStartKey | undefined => {
  if (!token) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
  } catch {
    throw new Error('Invalid nextToken');
  }
};
