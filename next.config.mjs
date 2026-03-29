/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    async rewrites() {
        return [
            {
                source: '/gameplay',
                destination: '/gameplay.html'
            },
            {
                source: '/favicon.ico',
                destination: '/favicon.ico'
            }
        ];
    }
};

export default nextConfig;
