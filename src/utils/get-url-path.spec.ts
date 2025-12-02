import { getUrlPath } from './get-url-path';

describe('getUrlPath', () => {
  it('builds url from https protocol and host', () => {
    const req = {
      protocol: 'https',
      headers: { host: 'example.com' },
    } as any as Request;

    expect(getUrlPath(req)).toBe('https://example.com');
  });

  it('includes port when host contains port', () => {
    const req = {
      protocol: 'http',
      headers: { host: 'localhost:3000' },
    } as any as Request;

    expect(getUrlPath(req)).toBe('http://localhost:3000');
  });

  it('returns protocol://undefined when host is missing', () => {
    const req = {
      protocol: 'http',
      headers: {},
    } as any as Request;

    expect(getUrlPath(req)).toBe('http://undefined');
  });
});
