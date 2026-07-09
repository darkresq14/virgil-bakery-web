import { expect, test } from '@playwright/test';

/**
 * Base URL for the dev server spun up by playwright.config.ts (webServer.url).
 * All SEO assertions assert absolute, self-referential values against this origin.
 */
const BASE_URL = 'http://localhost:3000';

/**
 * Precondition: the dev database must carry representative seed content — at
 * least one published post (so `/posts` and the pagination path are real), at
 * least one published product, and a present Homepage global. See issue #24.
 */
test.describe('Frontend SEO', () => {
  test('products listing emits a self-referential canonical', async ({ page }) => {
    await page.goto(`${BASE_URL}/produse`);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${BASE_URL}/produse`,
    );
  });

  test('posts listing emits a self-referential canonical', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts`);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${BASE_URL}/posts`,
    );
  });

  test('/posts/page/1 permanently redirects to /posts', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/page/1`, {
      maxRedirects: 0,
    });

    // Permanent (301 by Next when permanent: true; 308 is also acceptable).
    expect([301, 308]).toContain(response.status());
    expect(response.headers()['location']).toMatch(/\/posts\/?$/);
  });

  test('pages sitemap contains the homepage location', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/pages-sitemap.xml`);

    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    // Homepage is served from the Homepage global (no collection doc), so it must
    // be declared explicitly. Its loc is the bare origin with a trailing slash.
    expect(body).toContain(`<loc>${BASE_URL}/</loc>`);
  });
});
