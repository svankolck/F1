/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'flagcdn.com' },
            { protocol: 'https', hostname: 'media.formula1.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'rjswxfjzyuwvhiplocse.supabase.co' },
        ],
    },
    eslint: {
        // Only warn on custom font in layout (we want it in layout for SPA behavior)
        ignoreDuringBuilds: false,
    },
    async headers() {
        return [
            {
                // Apply security headers to all routes
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: blob: https://flagcdn.com https://media.formula1.com https://lh3.googleusercontent.com https://rjswxfjzyuwvhiplocse.supabase.co",
                            "connect-src 'self' https://rjswxfjzyuwvhiplocse.supabase.co https://*.supabase.co https://api.jolpi.ca https://vercel.live https://va.vercel-scripts.com wss://rjswxfjzyuwvhiplocse.supabase.co",
                            "frame-src 'self' https://vercel.live",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'none'",
                            "upgrade-insecure-requests",
                        ].join('; '),
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
