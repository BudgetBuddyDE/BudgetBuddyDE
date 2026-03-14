import {S3Client} from '@aws-sdk/client-s3';
import {EnvironmentVariableNotSetError} from '../types/error';

let s3Client: S3Client | null = null;

export function getS3Client() {
  if (s3Client !== null) {
    return s3Client;
  }

  const {
    AWS_ENDPOINT_URL,
    // AWS_S3_BUCKET_NAME,
    AWS_DEFAULT_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
  } = process.env;
  const missingEnvVars = [
    'AWS_ENDPOINT_URL',
    'AWS_S3_BUCKET_NAME',
    'AWS_DEFAULT_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ].filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    throw new EnvironmentVariableNotSetError(missingEnvVars.join(', '));
  }

  s3Client = new S3Client({
    region: AWS_DEFAULT_REGION as string,
    endpoint: AWS_ENDPOINT_URL as string,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID as string,
      secretAccessKey: AWS_SECRET_ACCESS_KEY as string,
    },
    forcePathStyle: false,
  });

  return s3Client;
}
