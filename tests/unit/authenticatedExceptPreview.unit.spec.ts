import type { AccessArgs } from 'payload';

import { afterEach, describe, expect, it } from 'vitest';

import { anyone } from '@/access/anyone';
import { authenticatedExceptPreview } from '@/access/authenticatedExceptPreview';
import { Media } from '@/collections/Media';
import type { User } from '@/payload-types';

// `authenticated` reads only `req.user`, so a stub request is enough to exercise
// the access function's external behaviour without booting Payload.
const args = (user?: User): AccessArgs<User> => ({ req: { user } }) as AccessArgs<User>;

const authed = args({ id: '1' } as User);
const anon = args(undefined);

describe('authenticatedExceptPreview (Media create/update/delete access)', () => {
  afterEach(() => {
    delete process.env.VERCEL_ENV;
  });

  it('denies writes on preview regardless of authentication', () => {
    process.env.VERCEL_ENV = 'preview';
    expect(authenticatedExceptPreview(authed)).toBe(false);
  });

  it('denies writes on preview even when no user is present', () => {
    process.env.VERCEL_ENV = 'preview';
    expect(authenticatedExceptPreview(anon)).toBe(false);
  });

  it('defers to authenticated (allows) off-preview when authenticated', () => {
    process.env.VERCEL_ENV = 'production';
    expect(authenticatedExceptPreview(authed)).toBe(true);
  });

  it('defers to authenticated (denies) off-preview when unauthenticated', () => {
    process.env.VERCEL_ENV = 'production';
    expect(authenticatedExceptPreview(anon)).toBe(false);
  });

  it('defers to authenticated in local dev (VERCEL_ENV unset)', () => {
    delete process.env.VERCEL_ENV;
    expect(authenticatedExceptPreview(authed)).toBe(true);
  });
});

describe('Media read access', () => {
  it('remains public (anyone) so the frontend renders restored production blob URLs', () => {
    expect(Media.access?.read).toBe(anyone);
  });
});
