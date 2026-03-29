/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    trailingSlash: false,
    async rewrites() {
        return [
            {
                source: '/gameplay',
                destination: '/gameplay.html'
            }
        ];
    }
};

export default nextConfig;
