import {requestRouter} from './router.test-utils';
import {attachmentRouter} from '../router/attachment.router';
const {service, log} = vi.hoisted(() => ({
  service: {verifyOwnership: vi.fn(), generateSignedUrl: vi.fn(), deleteAttachments: vi.fn()},
  log: {error: vi.fn(), child: vi.fn().mockReturnThis()},
}));
vi.mock('../lib', () => ({logger: {...log, child: () => log}}));
vi.mock('../config', () => ({config: {getRequiredObjectStorageConfig: () => ({bucketName: 'test'})}}));
vi.mock('../lib/attachment', () => ({TransactionAttachmentHandler: vi.fn(() => service)}));
const ID = '00000000-0000-4000-8000-000000000001';
const attachment = {
  id: ID,
  ownerId: 'owner',
  fileName: 'receipt.pdf',
  fileExtension: 'pdf',
  contentType: 'application/pdf',
  location: 'path',
  createdAt: new Date('2026-01-01'),
};
beforeEach(() => {
  vi.resetAllMocks();
  service.verifyOwnership.mockResolvedValue(attachment);
  service.generateSignedUrl.mockResolvedValue('https://signed.test/receipt');
  service.deleteAttachments.mockResolvedValue(1);
});
it.each(['GET', 'DELETE'] as const)('rejects unauthenticated %s', async method => {
  expect((await requestRouter(attachmentRouter, null, `/${ID}`, {method})).status).toBe(401);
  expect(service.verifyOwnership).not.toHaveBeenCalled();
  expect(service.deleteAttachments).not.toHaveBeenCalled();
});
it('returns only an owned attachment and honours signed URL TTL', async () => {
  const response = await requestRouter(attachmentRouter, 'owner', `/${ID}?ttl=120`, {method: 'GET'});
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    data: {...attachment, createdAt: '2026-01-01T00:00:00.000Z', signedUrl: 'https://signed.test/receipt'},
  });
  expect(service.verifyOwnership).toHaveBeenCalledWith(ID, 'owner');
  expect(service.generateSignedUrl).toHaveBeenCalledWith(attachment, {ttl: 120});
});
it('returns 404 for an attachment owned by another user', async () => {
  service.verifyOwnership.mockResolvedValueOnce(undefined);
  expect((await requestRouter(attachmentRouter, 'owner', `/${ID}`, {method: 'GET'})).status).toBe(404);
  expect(service.generateSignedUrl).not.toHaveBeenCalled();
});
it.each([
  ['GET', 'verifyOwnership'],
  ['DELETE', 'deleteAttachments'],
] as const)('masks %s storage failures', async (method, operation) => {
  service[operation].mockRejectedValueOnce('private storage detail');
  const response = await requestRouter(attachmentRouter, 'owner', `/${ID}`, {method});
  expect(response.status).toBe(500);
  expect(JSON.stringify(response.body)).not.toContain('private storage detail');
  expect(log.error).toHaveBeenCalled();
});
it('deletes only the owner supplied to the service', async () => {
  expect((await requestRouter(attachmentRouter, 'owner', `/${ID}`, {method: 'DELETE'})).status).toBe(200);
  expect(service.deleteAttachments).toHaveBeenCalledWith('owner', [ID]);
});
it('returns 404 when deletion finds no owned attachment', async () => {
  service.deleteAttachments.mockResolvedValueOnce(0);
  expect((await requestRouter(attachmentRouter, 'owner', `/${ID}`, {method: 'DELETE'})).status).toBe(404);
});
it('rejects malformed IDs and TTLs before accessing storage', async () => {
  expect((await requestRouter(attachmentRouter, 'owner', '/bad', {method: 'GET'})).status).toBe(400);
  expect((await requestRouter(attachmentRouter, 'owner', `/${ID}?ttl=-1`, {method: 'GET'})).status).toBe(400);
  expect(service.verifyOwnership).not.toHaveBeenCalled();
});
