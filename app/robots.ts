import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/admin'] },
      { userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot'], allow: '/', disallow: ['/admin', '/api/admin'] },
    ],
    sitemap: 'https://www.nomade-foix.fr/sitemap.xml',
  };
}
