import {createBackendTraceUrlPattern} from './tracePropagation';

it('matches backend paths and query strings for the configured origin only', () => {
  const pattern = createBackendTraceUrlPattern('https://api.example.com:9443');

  expect(pattern.test('https://api.example.com:9443/api/transactions?page=2')).toBe(true);
  expect(pattern.test('https://api.example.com:9443')).toBe(true);
  expect(pattern.test('https://api.example.com.evil.test/api/transactions')).toBe(false);
  expect(pattern.test('https://other.example.com:9443/api/transactions')).toBe(false);
});

it('matches the default localhost backend with its port', () => {
  const pattern = createBackendTraceUrlPattern('http://localhost:9000');

  expect(pattern.test('http://localhost:9000/api/category')).toBe(true);
  expect(pattern.test('http://localhost:9001/api/category')).toBe(false);
});
