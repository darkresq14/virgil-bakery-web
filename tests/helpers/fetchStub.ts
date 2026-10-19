import { vi } from 'vitest';

/** Minimal Response stand-in — keeps tests off any concrete fetch impl. */
export interface ResponseLike {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}

/** Stubbed global fetch: records every call, answers from a script. */
export function stubFetch(
  script: (url: string, init?: RequestInit) => ResponseLike | Promise<ResponseLike> | never,
) {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const fetchMock = vi.fn(async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return script(String(url), init);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

/** A JSON-bearing page (the echo/exec answer). */
export function jsonPage(body: unknown, status = 200): ResponseLike {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  };
}

/** The 302 the Apps Script /exec endpoint answers with. */
export function redirectPage(location: string, status = 302): ResponseLike {
  return {
    ok: false,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'location' ? location : null) },
    json: () => Promise.reject(new Error('no body on redirect')),
  };
}

/** A fetch answer that never resolves unless the caller aborts it. */
export function hangingResponse(init?: RequestInit): Promise<ResponseLike> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('This operation was aborted')));
  });
}
