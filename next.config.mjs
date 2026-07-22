/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Static, request-independent security headers on every route.
        // (Content-Security-Policy is NOT set here — it needs a per-request
        // nonce, so it's set in middleware instead: src/lib/supabase/middleware.ts)
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // No client code calls navigator.geolocation (masjid search
            // uses server-side Nominatim on user-typed text), so deny outright.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
