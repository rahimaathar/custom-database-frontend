/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://custom-database-backend.onrender.com/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
