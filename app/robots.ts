import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const disallowPrivate = ['/admin', '/api/'];
  const allowPublicApi = ['/api/menu/media/', '/api/nomade-css'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', ...allowPublicApi],
        disallow: disallowPrivate,
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-SearchBot',
          'PerplexityBot',
        ],
        allow: ['/', ...allowPublicApi],
        disallow: disallowPrivate,
      },
    ],
    sitemap: 'https://www.nomade-foix.fr/sitemap.xml',
  };
}
