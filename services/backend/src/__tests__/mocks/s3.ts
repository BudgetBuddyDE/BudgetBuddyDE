import {mock, type AnyMock} from './mock';

export const s3Send: AnyMock = mock(async () => ({}));
export const s3Destroy: AnyMock = mock();
export const s3Client = {send: s3Send, destroy: s3Destroy};

export function getS3Client() {
  return s3Client;
}

export function destroyS3Client(): void {
  s3Destroy();
}

export function resetS3Mock(): void {
  s3Send.mockReset();
  s3Send.mockResolvedValue({});
  s3Destroy.mockReset();
}
