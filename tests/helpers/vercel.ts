import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Invocation directe d'un handler Vercel — sans serveur HTTP. */
export interface InvokeResult {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

export async function invoke(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown,
  opts: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  } = {},
): Promise<InvokeResult> {
  const result: InvokeResult = { status: 0, body: undefined, headers: {} };

  const req = {
    method: opts.method ?? 'POST',
    body: opts.body,
    headers: opts.headers ?? {},
    query: opts.query ?? {},
    cookies: {},
  } as unknown as VercelRequest;

  let resolve!: () => void;
  const done = new Promise<void>((r) => { resolve = r; });

  const res = {
    setHeader(name: string, value: string) { result.headers[name.toLowerCase()] = value; return res; },
    getHeader(name: string) { return result.headers[name.toLowerCase()]; },
    status(code: number) { result.status = code; return res; },
    json(obj: unknown) { result.body = obj; resolve(); return res; },
    send(obj: unknown) { result.body = obj; resolve(); return res; },
    end(payload?: unknown) { if (payload !== undefined) result.body = payload; resolve(); return res; },
  } as unknown as VercelResponse;

  await handler(req, res);
  await done;
  return result;
}
