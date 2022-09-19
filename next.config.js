/** @type {import('next').NextConfig} */
module.exports = {
    reactStrictMode: true,
    basePath: process.env.BASE_PATH,
    i18n: {
        locales: ['en'],
        defaultLocale: 'en'
    },
    async redirects() {
        return [
          {
            source: '/p/:uuid*',
            destination: '/player/:uuid*',
            permanent: true,
          },
          {
            source: '/i/:tag*',
            destination: '/item/:tag*',
            permanent: true,
          },
          {
            source: '/a/:auctionUUID*',
            destination: '/auction/:auctionUUID*',
            permanent: true,
          },
        ]
      }
}
