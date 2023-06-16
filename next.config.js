/** @type {import('next').NextConfig} */
module.exports = {
    reactStrictMode: true,
    basePath: process.env.BASE_PATH,
    i18n: {
        locales: ['en'],
        defaultLocale: 'en'
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'crafatar.com'
            },
            {
                protocol: 'https',
                hostname: '**.coflnet.com'
            },
            {
                protocol: 'https',
                hostname: 'mc-heads.net'
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com'
            }
        ]
    },
    async redirects() {
        return [
            {
                source: '/p/:uuid*',
                destination: '/player/:uuid*',
                permanent: true
            },
            {
                source: '/i/:tag*',
                destination: '/item/:tag*',
                permanent: true
            },
            {
                source: '/a/:auctionUUID*',
                destination: '/auction/:auctionUUID*',
                permanent: true
            }
        ]
    },
    experimental: {
        appDir: true,
        serverComponentsExternalPackages: ['react-bootstrap', 'react-toastify']
    }
}
