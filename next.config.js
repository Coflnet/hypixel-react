/** @type {import('next').NextConfig} */
module.exports = {
    reactStrictMode: true,
    i18n: {
        locales: ['en'],
        defaultLocale: 'en'
    },
    basePath: process.env.BASE_PATH || undefined,
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
    }
}
