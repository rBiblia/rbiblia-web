import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeJsonParse } from '../../assets/js/safeJsonParse';

describe('safeJsonParse', () => {
  let warnSpy, debugSpy;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('parses valid JSON response', async () => {
    const response = new Response(JSON.stringify({ data: [1, 2] }), { status: 200 });
    const result = await safeJsonParse(response);
    expect(result.data).toEqual([1, 2]);
  });

  it('extracts JSON when PHP appends warnings', async () => {
    const body = '{"data":"ok"}\n<br /><b>Warning</b>: something';
    const response = new Response(body, { status: 200 });
    const result = await safeJsonParse(response);
    expect(result.data).toBe('ok');
  });

  it('throws on non-ok response with message', async () => {
    const response = new Response('{"message":"Not found"}', { status: 404 });
    await expect(safeJsonParse(response)).rejects.toThrow('Not found');
  });

  it('throws default error on non-ok response without message', async () => {
    const response = new Response('{}', { status: 500, statusText: 'Internal Server Error' });
    await expect(safeJsonParse(response)).rejects.toThrow('Server error (500)');
  });
  
  it('throws on invalid json', async () => {
    const response = new Response('invalid json', { status: 200 });
    await expect(safeJsonParse(response)).rejects.toThrow();
  });
});
