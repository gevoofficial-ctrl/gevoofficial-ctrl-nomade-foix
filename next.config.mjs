/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/lesmenu', destination: '/fr/carte', permanent: true },
      { source: '/lesmenu/', destination: '/fr/carte', permanent: true },
      { source: '/mentions-legales', destination: '/fr/mentions-legales', permanent: true },
      { source: '/mentions-legales/', destination: '/fr/mentions-legales', permanent: true },
      { source: '/politique-de-confidentialite', destination: '/fr/confidentialite', permanent: true },
      { source: '/politique-de-confidentialite/', destination: '/fr/confidentialite', permanent: true },
      { source: '/allergenes', destination: '/fr/allergenes', permanent: true },
      { source: '/allergenes/', destination: '/fr/allergenes', permanent: true },
      { source: '/menu', destination: '/fr/carte', permanent: true },
      { source: '/menu/', destination: '/fr/carte', permanent: true },
      { source: '/carte', destination: '/fr/carte', permanent: true },
      { source: '/carte/', destination: '/fr/carte', permanent: true },
      { source: '/reservation', destination: '/fr#reservation', permanent: true },
      { source: '/reservation/', destination: '/fr#reservation', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; img-src 'self' data: blob:; media-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; upgrade-insecure-requests" },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/video/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/nomade-logo-light.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};
export default nextConfig;
