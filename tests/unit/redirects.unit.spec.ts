import { beforeEach, describe, expect, it } from 'vitest';

import { redirects } from '../../redirects';

describe('redirects', () => {
  let redirectEntries: Awaited<ReturnType<typeof redirects>>;

  beforeEach(async () => {
    redirectEntries = await redirects();
  });

  describe('WordPress homepage redirects', () => {
    it('redirects /home to /', () => {
      const match = redirectEntries.find((r) => r.source === '/home');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/');
      expect(match!.permanent).toBe(true);
    });

    it('redirects /acasa to /', () => {
      const match = redirectEntries.find((r) => r.source === '/acasa');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/');
      expect(match!.permanent).toBe(true);
    });
  });

  describe('missing WordPress URL redirects', () => {
    it('redirects /paine-cu-nuca to /produse/paine-cu-nuca', () => {
      const match = redirectEntries.find((r) => r.source === '/paine-cu-nuca');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/produse/paine-cu-nuca');
      expect(match!.permanent).toBe(true);
    });

    it('redirects /maia-de-17-ani-analizata-healthferm to /posts/17-ani-de-maia', () => {
      const match = redirectEntries.find(
        (r) => r.source === '/maia-de-17-ani-analizata-healthferm',
      );

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/posts/17-ani-de-maia');
      expect(match!.permanent).toBe(true);
    });

    it('redirects /despre-painea-cu-maia-repetitie... to /posts/17-ani-de-maia', () => {
      const match = redirectEntries.find(
        (r) =>
          r.source === '/despre-painea-cu-maia-repetitie-si-lucruri-care-nu-se-invata-din-retete',
      );

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/posts/17-ani-de-maia');
      expect(match!.permanent).toBe(true);
    });

    it('redirects /blog-vechi to /posts', () => {
      const match = redirectEntries.find((r) => r.source === '/blog-vechi');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/posts');
      expect(match!.permanent).toBe(true);
    });
  });

  describe('chain flattening redirects', () => {
    it('redirects /paine-integrala directly to /produse/paine-integrala (skip -cu-maia hop)', () => {
      const match = redirectEntries.find((r) => r.source === '/paine-integrala');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/produse/paine-integrala');
      expect(match!.permanent).toBe(true);
    });

    it('redirects /paine-mixta directly to /produse/paine-mixta (skip -cu-maia hop)', () => {
      const match = redirectEntries.find((r) => r.source === '/paine-mixta');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/produse/paine-mixta');
      expect(match!.permanent).toBe(true);
    });
  });

  describe('catch-all archive redirects', () => {
    it('redirects /tag/:slug* to /posts', () => {
      const match = redirectEntries.find((r) => r.source === '/tag/:slug*');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/posts');
      expect(match!.permanent).toBe(true);
    });

    it('redirects /category/:slug* to /posts', () => {
      const match = redirectEntries.find((r) => r.source === '/category/:slug*');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/posts');
      expect(match!.permanent).toBe(true);
    });

    it('redirects /author/:slug* to /', () => {
      const match = redirectEntries.find((r) => r.source === '/author/:slug*');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/');
      expect(match!.permanent).toBe(true);
    });
  });

  describe('posts archive page-1 dedup redirect', () => {
    it('redirects /posts/page/1 to /posts', () => {
      const match = redirectEntries.find((r) => r.source === '/posts/page/1');

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/posts');
      expect(match!.permanent).toBe(true);
    });
  });

  describe('blog post -2 variant redirect', () => {
    it('redirects /de-ce-am-facut-o-maia...tarziu-2 to /posts/17-ani-de-maia', () => {
      const match = redirectEntries.find(
        (r) =>
          r.source ===
          '/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu-2',
      );

      expect(match).toBeDefined();
      expect(match!.destination).toBe('/posts/17-ani-de-maia');
      expect(match!.permanent).toBe(true);
    });
  });

  describe('all WordPress redirects are permanent (301)', () => {
    it('every non-IE redirect has permanent: true', () => {
      const wpRedirects = redirectEntries.filter((r) => !('has' in r && r.has));

      for (const redirect of wpRedirects) {
        expect(redirect.permanent).toBe(true);
      }
    });
  });
});
