/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    async rewrites() {
        return [
            {
                source: '/gameplay',
                destination: '/gameplay.html',
            },
            {
                source: '/index.html',
                destination: '/',
            },
        ];
    },
};

export default nextConfig;
