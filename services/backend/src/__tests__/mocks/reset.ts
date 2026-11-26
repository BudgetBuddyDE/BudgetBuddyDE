import {resetAttachmentMock} from './attachment';
import {resetAuthMock} from './auth';
import {resetCacheMock} from './cache';
import {resetConfigOverrides} from './configState';
import {resetDbMock} from './db';
import {resetLoggerMock} from './logger';
import {resetRedisMock} from './redis';
import {resetS3Mock} from './s3';

/** Restores every shared backend double to its safe default before a test. */
export function resetSharedMocks(): void {
  resetConfigOverrides();
  resetDbMock();
  resetRedisMock();
  resetLoggerMock();
  resetS3Mock();
  resetAttachmentMock();
  resetCacheMock();
  resetAuthMock();
}
