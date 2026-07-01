// Global test setup – silence console output during tests
vi.spyOn(console, 'table').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});
