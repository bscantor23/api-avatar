import { getPageConfig } from './page-configuration';

describe('getPageConfig', () => {
  it('returns correct pagination for a middle page', () => {
    const res = getPageConfig(2, 10, 100);
    expect(res.info.total).toBe(100);
    expect(res.info.limit).toBe(10);
    expect(res.info.page.current).toBe(2);
    expect(res.info.page.next).toBe(3);
    expect(res.info.page.prev).toBe(1);
  });

  it('first page has prev null and next defined when more pages exist', () => {
    const res = getPageConfig(1, 10, 15); // totalPages = 2
    expect(res.info.page.current).toBe(1);
    expect(res.info.page.prev).toBeNull();
    expect(res.info.page.next).toBe(2);
  });

  it('last page has next null and prev defined', () => {
    const res = getPageConfig(3, 5, 15); // totalPages = 3
    expect(res.info.page.current).toBe(3);
    expect(res.info.page.next).toBeNull();
    expect(res.info.page.prev).toBe(2);
  });

  it('single page when total <= limit', () => {
    const res = getPageConfig(1, 10, 5); // totalPages = 1
    expect(res.info.page.current).toBe(1);
    expect(res.info.page.next).toBeNull();
    expect(res.info.page.prev).toBeNull();
  });

  it('handles page greater than totalPages (next null, prev = page-1)', () => {
    const res = getPageConfig(5, 10, 30); // totalPages = 3
    expect(res.info.total).toBe(30);
    expect(res.info.page.current).toBe(5);
    expect(res.info.page.next).toBeNull();
    expect(res.info.page.prev).toBe(4);
  });
});
