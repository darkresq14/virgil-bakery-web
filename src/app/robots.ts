import type { MetadataRoute } from 'next';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://painecumaiabyvirgil.ro';

/**
 * AI-search policy (see .agents/skills/ai-seo): everything is allowed by
 * default, including AI search-and-cite crawlers — GPTBot, ChatGPT-User,
 * OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, Applebot.
 * Blocking them would remove the site from ChatGPT/Perplexity/Gemini answers.
 * CCBot (Common Crawl) is the single exception: training-only, no citation
 * value. Scanners/renderers ignore robots.txt anyway — the quota defense
 * against them is the ImageMedia slot-split, not this file.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: [
      `${serverUrl}/pages-sitemap.xml`,
      `${serverUrl}/posts-sitemap.xml`,
      `${serverUrl}/products-sitemap.xml`,
    ],
  };
}
