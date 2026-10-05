import {EventEmitter} from 'node:events';
import type {NextFunction, Request, Response} from 'express';
import {handleError} from '../middleware/handleError.middleware';
import {logRequest} from '../middleware/logRequest.middleware';
import {servedBy} from '../middleware/servedBy.middleware';

const {log} = vi.hoisted(() => ({
  log: {info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn().mockReturnThis()},
}));
vi.mock('../lib/logger', () => ({logger: log}));
vi.mock('../config', () => ({config: {port: 9000, service: 'backend', version: '1.0'}}));
beforeEach(() => vi.clearAllMocks());
function response() {
  return Object.assign(new EventEmitter(), {
    statusCode: 200,
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  }) as unknown as Response;
}
it('sets the service identity and continues', () => {
  const res = response();
  const next = vi.fn();
  servedBy({} as Request, res, next);
  expect(res.setHeader).toHaveBeenCalledWith('X-Served-By', 'backend::1.0');
  expect(next).toHaveBeenCalledOnce();
});
it('logs internal errors but returns only a safe error response', () => {
  const res = response();
  const error = new Error('secret credentials');
  handleError(error, {} as Request, res, vi.fn() as NextFunction);
  expect(log.error).toHaveBeenCalledWith('Error occurred: %s', 'Error', error);
  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'Internal Server Error'}));
  expect(JSON.stringify(vi.mocked(res.json).mock.calls)).not.toContain('secret credentials');
});
it.each([
  [200, 'info'],
  [302, 'info'],
  [404, 'warn'],
  [503, 'error'],
] as const)('logs %i responses at %s after completion', (statusCode, level) => {
  const req = {
    method: 'GET',
    ip: '127.0.0.1',
    originalUrl: '/api/category',
    headers: {'x-request-id': 'request-1', origin: 'https://web.test'},
    context: {user: {id: 'owner'}},
  } as unknown as Request;
  const res = response();
  res.statusCode = statusCode;
  const next = vi.fn();
  logRequest(req, res, next);
  expect(log[level]).not.toHaveBeenCalled();
  res.emit('finish');
  expect(next).toHaveBeenCalledOnce();
  expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'request-1');
  expect(log[level]).toHaveBeenCalledWith(
    expect.stringContaining(String(statusCode)),
    expect.objectContaining({
      userId: 'owner',
      requestId: 'request-1',
      origin: 'https://web.test',
      durationMs: expect.any(Number),
    }),
  );
});
it('generates a request ID and tolerates an unauthenticated request without origin', () => {
  const req = {method: 'GET', ip: '127.0.0.1', originalUrl: '/health', headers: {}} as Request;
  const res = response();
  logRequest(req, res, vi.fn());
  res.emit('finish');
  expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', expect.stringMatching(/^[a-f0-9-]{36}$/));
  expect(log.info).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({userId: undefined, origin: 'unknown'}),
  );
});
