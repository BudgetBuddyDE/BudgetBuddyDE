// Global test setup – silence console output during tests
process.env.BUDGETBUDDY_BACKEND_URL ??= 'http://localhost:9000';
vi.spyOn(console, 'table').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});
