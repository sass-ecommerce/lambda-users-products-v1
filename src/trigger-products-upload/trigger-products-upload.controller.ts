import { S3Event, S3Handler } from 'aws-lambda';
import axios from 'axios';

const PRODUCTS_IMAGES_URL = `${process.env.BACKEND_URL}/api/products/images`;

export const productsUpload: S3Handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const { bucket, object } = record.s3;
    const key = decodeURIComponent(object.key.replace(/\+/g, ' '));

    // key format: {tenantId}/products/{productId}/{filename}
    const [tenantId, , productId] = key.split('/');

    console.log(
      JSON.stringify({
        eventName: record.eventName,
        eventTime: record.eventTime,
        bucket: bucket.name,
        key,
        size: object.size,
        etag: object.eTag,
        tenantId,
        productId,
      }),
    );

    await axios.post(PRODUCTS_IMAGES_URL, { productId, tenantId, s3Key: key });
  }
};
