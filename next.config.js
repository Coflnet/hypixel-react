const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn']
        } : false,
    },
    experimental: {
        optimizePackageImports: ['echarts', 'echarts-for-react', 'react-bootstrap', '@mui/material', '@mui/icons-material'],
    },
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
    modularizeImports: {
        '@mui/material': {
            transform: '@mui/material/{{member}}'
        },
        '@mui/icons-material': {
            transform: '@mui/icons-material/{{member}}'
        }
    }
}

module.exports = withMDX(nextConfig)
