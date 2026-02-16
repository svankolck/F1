/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'flagcdn.com' },
            { protocol: 'https', hostname: 'media.formula1.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'rjswxfjzyuwvhiplocse.supabase.co' },
            { protocol: 'https', hostname: 'upload.wikimedia.org' },
            { protocol: 'https', hostname: 'seeklogo.com' },
            { protocol: 'https', hostname: 'brandfetch.com' },
            { protocol: 'https', hostname: 'logodownload.org' },
        ],
    },
    eslint: {
        // Only warn on custom font in layout (we want it in layout for SPA behavior)
        ignoreDuringBuilds: false,
    },
};

export default nextConfig;
