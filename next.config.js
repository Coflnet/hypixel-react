const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    eslint: {
        ignoreDuringBuilds: true
    },
    basePath: process.env.BASE_PATH,
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'sky.coflnet.com'
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
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    }
                ]
            },
            {
                // the 307 of validateRSCRequestHeaders must never be stored under a page url by a shared cache
                source: '/:path*',
                has: [{ type: 'header', key: 'rsc', value: '1' }],
                missing: [{ type: 'query', key: '_rsc' }],
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'private, no-store'
                    }
                ]
            }
        ]
    },
    modularizeImports: {
        '@mui/material': {
            transform: '@mui/material/{{member}}'
        },
        '@mui/icons-material': {
            transform: '@mui/icons-material/{{member}}'
        }
    },
    experimental: {
        // answer RSC requests whose _rsc param does not match their headers with a redirect, so a shared cache keyed by URL only (Cloudflare) cannot store a flight payload as the page
        validateRSCRequestHeaders: true,
        optimizePackageImports: ['echarts-for-react', 'react-bootstrap', '@mui/icons-material']
    }
}

module.exports = withMDX(nextConfig)
