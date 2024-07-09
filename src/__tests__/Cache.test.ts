import {CacheService} from '../services/Cache.service';

describe('determineTtlForMetal', () => {
  it('should return the correct TTL for metal when the current time is 13:59:50', () => {
    const now = new Date();
    now.setHours(13, 59, 50, 0);
    const spy = jest.spyOn(global, 'Date').mockImplementation(() => now);
    expect(CacheService.determineTtlForMetal()).toBe(36009);
    spy.mockRestore();
  });

  it('should return the correct TTL for metal when the current time is 23:59:50', () => {
    const now = new Date();
    now.setHours(23, 59, 50, 0);
    const spy = jest.spyOn(global, 'Date').mockImplementation(() => now);
    expect(CacheService.determineTtlForMetal()).toBe(9);
    spy.mockRestore();
  });
});
