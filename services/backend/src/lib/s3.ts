import {S3Client} from '@aws-sdk/client-s3';
import {getRequiredObjectStorageConfig} from '../config';

let s3Client: S3Client | null = null;

export function getS3Client() {
  if (s3Client !== null) {
    return s3Client;
  }

  const objectStorage = getRequiredObjectStorageConfig();

  s3Client = new S3Client({
    region: objectStorage.region,
    endpoint: objectStorage.endpoint,
    credentials: {
      accessKeyId: objectStorage.accessKeyId,
      secretAccessKey: objectStorage.secretAccessKey,
    },
    forcePathStyle: objectStorage.forcePathStyle,
  });

  return s3Client;
}
