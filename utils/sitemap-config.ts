/**
 * Sitemap configuration for Hypixel SkyBlock Price Tracker
 * This file contains SEO-optimized settings for search engine crawling
 */

export interface SitemapPage {
    url: string;
    priority: number;
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    title: string;
    description?: string;
    keywords?: string[];
}

export const SITEMAP_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://sky.coflnet.com',
    basePath: process.env.BASE_PATH || '',
    maxUrlsPerSitemap: 45000,
    
    // SEO Keywords for Hypixel SkyBlock Price Tracking
    globalKeywords: [
        'hypixel skyblock',
        'auction house',
        'bazaar prices',
        'price tracker',
        'profit calculator',
        'item prices',
        'skyblock trading',
        'coflnet',
        'flip tracker',
        'market analysis'
    ],

    // Static pages configuration with SEO optimization
    staticPages: [
        {
            url: '',
            priority: 1.0,
            changefreq: 'daily' as const,
            title: 'Hypixel SkyBlock Price Tracker - Live Auction House & Bazaar Prices',
            description: 'Track live prices for Hypixel SkyBlock items. Real-time auction house and bazaar data, profit calculators, and trading tools.',
            keywords: ['hypixel skyblock prices', 'auction house tracker', 'bazaar prices', 'price tracking']
        },
        {
            url: '/flipper',
            priority: 0.9,
            changefreq: 'hourly' as const,
            title: 'Auction House Flipper - Find Profitable Items to Flip',
            description: 'Discover profitable auction house flips with real-time price analysis and profit calculations.',
            keywords: ['auction flipper', 'profit calculator', 'skyblock flipping', 'item flips']
        },
        {
            url: '/bazaar',
            priority: 0.9,
            changefreq: 'hourly' as const,
            title: 'Bazaar Price Tracker - Real-time Market Data and Trends',
            description: 'Monitor Hypixel SkyBlock bazaar prices with real-time market data, trends, and profit opportunities.',
            keywords: ['bazaar prices', 'bazaar tracker', 'market data', 'price trends']
        },
        {
            url: '/flips',
            priority: 0.9,
            changefreq: 'hourly' as const,
            title: 'Recent Auction Flips & Profit Tracking Analytics',
            description: 'View recent profitable flips and track your trading performance with detailed analytics.',
            keywords: ['auction flips', 'profit tracking', 'flip analytics', 'trading history']
        },
        {
            url: '/crafts',
            priority: 0.7,
            changefreq: 'daily' as const,
            title: 'Profitable Crafting Recipes Tracker and Calculator',
            description: 'Find profitable crafting recipes with cost analysis and profit calculations.',
            keywords: ['crafting calculator', 'recipe profits', 'crafting guide', 'item crafting']
        },
        {
            url: '/lowSupply',
            priority: 0.8,
            changefreq: 'hourly' as const,
            title: 'Low Supply Items - High Demand Trading Opportunities',
            description: 'Discover items with low supply and high demand for profitable trading opportunities.',
            keywords: ['low supply items', 'high demand', 'trading opportunities', 'market analysis']
        },
        {
            url: '/recentflips',
            priority: 0.8,
            changefreq: 'hourly' as const,
            title: 'Recent Profitable Flips and Market Opportunities',
            description: 'View the most recent profitable flips and emerging market opportunities.',
            keywords: ['recent flips', 'market opportunities', 'profit analysis', 'trading alerts']
        },
        {
            url: '/bookFlips',
            priority: 0.8,
            changefreq: 'hourly' as const,
            title: 'Enchanted Book Profit Tracker and Trading Guide',
            description: 'Track enchanted book prices and find profitable trading opportunities.',
            keywords: ['enchanted books', 'book prices', 'book trading', 'enchantment profits']
        },
        {
            url: '/npc',
            priority: 0.6,
            changefreq: 'daily' as const,
            title: 'NPC Trading Prices & Profit Calculator',
            description: 'Calculate profits from NPC trading with real-time price comparisons.',
            keywords: ['npc prices', 'npc trading', 'vendor prices', 'npc profit']
        },
        {
            url: '/kat',
            priority: 0.6,
            changefreq: 'daily' as const,
            title: 'Kat Pet Upgrade Cost Calculator and Profit Analysis',
            description: 'Calculate Kat pet upgrade costs and analyze profit potential for pet trading.',
            keywords: ['kat upgrade', 'pet calculator', 'pet costs', 'pet trading']
        },
        {
            url: '/trade',
            priority: 0.6,
            changefreq: 'daily' as const,
            title: 'Trade Tracker & Value Calculator for Item Exchange',
            description: 'Track trades and calculate item values for fair exchanges and profit analysis.',
            keywords: ['trade tracker', 'item exchange', 'trade calculator', 'value calculator']
        },
        {
            url: '/fusion',
            priority: 0.7,
            changefreq: 'daily' as const,
            title: 'Attribute Fusion Profit Calculator and Cost Analysis',
            description: 'Calculate attribute fusion costs and profits for Hypixel SkyBlock items.',
            keywords: ['attribute fusion', 'fusion calculator', 'attribute costs', 'fusion profit']
        },
        // Wiki pages
        {
            url: '/wiki',
            priority: 0.7,
            changefreq: 'weekly' as const,
            title: 'Hypixel SkyBlock Guides & Documentation Wiki',
            description: 'Comprehensive guides and documentation for using Hypixel SkyBlock price tracking tools and features.',
            keywords: ['skyblock guides', 'documentation', 'tutorials', 'wiki', 'help guides']
        },
        {
            url: '/wiki/quick-start',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'Quick Start Guide - Getting Started with Price Tracking',
            description: 'Quick start guide to begin using Hypixel SkyBlock price tracking tools effectively.',
            keywords: ['quick start', 'getting started', 'price tracking guide', 'tutorial']
        },
        {
            url: '/wiki/flipper',
            priority: 0.8,
            changefreq: 'monthly' as const,
            title: 'Auction Flipper Guide - Master Profitable Trading',
            description: 'Complete guide to using the auction flipper for profitable Hypixel SkyBlock trading.',
            keywords: ['flipper guide', 'auction flipping', 'trading tutorial', 'profit guide']
        },
        {
            url: '/wiki/auction-house',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'Auction House Tracker Guide and Best Practices',
            description: 'Learn how to effectively use the auction house tracker and bidding strategies.',
            keywords: ['auction house guide', 'bidding strategies', 'auction tracker', 'auction tips']
        },
        {
            url: '/wiki/filters',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'Item Filters Guide - Advanced Search and Filtering',
            description: 'Master advanced filtering techniques to find the best trading opportunities.',
            keywords: ['item filters', 'search guide', 'filtering tutorial', 'advanced search']
        },
        {
            url: '/wiki/mod',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'CoflMod Installation and Usage Guide',
            description: 'Complete guide to installing and using CoflMod for in-game price tracking.',
            keywords: ['coflmod guide', 'mod installation', 'minecraft mod', 'client mod setup']
        },
        {
            url: '/wiki/api',
            priority: 0.5,
            changefreq: 'monthly' as const,
            title: 'API Documentation for Developers',
            description: 'Complete API documentation for developers integrating with our price tracking services.',
            keywords: ['api documentation', 'developer guide', 'api integration', 'development']
        },
        {
            url: '/wiki/account-setup',
            priority: 0.5,
            changefreq: 'monthly' as const,
            title: 'Account Setup and Configuration Guide',
            description: 'Step-by-step guide to setting up your account and configuring preferences.',
            keywords: ['account setup', 'configuration guide', 'user settings', 'account tutorial']
        },
        {
            url: '/wiki/premium',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'Premium Features Guide and Benefits Overview',
            description: 'Comprehensive guide to premium features and their benefits for advanced users.',
            keywords: ['premium guide', 'premium features', 'subscription benefits', 'advanced features']
        },
        {
            url: '/premium',
            priority: 0.6,
            changefreq: 'weekly' as const,
            title: 'Premium Features for Advanced Trading and Analytics',
            description: 'Unlock advanced trading tools and analytics with premium subscription features.',
            keywords: ['premium features', 'advanced trading', 'trading tools', 'analytics']
        },
        {
            url: '/mod',
            priority: 0.5,
            changefreq: 'weekly' as const,
            title: 'CoflMod - Client Side Price Tracker Minecraft Mod',
            description: 'Download and use CoflMod for real-time price tracking directly in Minecraft.',
            keywords: ['coflmod', 'minecraft mod', 'price mod', 'client mod']
        },
        {
            url: '/about',
            priority: 0.5,
            changefreq: 'monthly' as const,
            title: 'About Hypixel SkyBlock Price Tracker and Coflnet Tools',
            description: 'Learn about our mission to provide the best price tracking tools for Hypixel SkyBlock.',
            keywords: ['about coflnet', 'price tracker info', 'team', 'mission']
        },
        {
            url: '/subscriptions',
            priority: 0.4,
            changefreq: 'weekly' as const,
            title: 'Subscription Management and Premium Plans',
            description: 'Manage your subscription and explore premium plans for enhanced features.',
            keywords: ['subscription', 'premium plans', 'billing', 'account management']
        },
        {
            url: '/account',
            priority: 0.4,
            changefreq: 'monthly' as const,
            title: 'Account Management and Settings',
            description: 'Manage your account settings, preferences, and profile information.',
            keywords: ['account settings', 'profile management', 'user preferences']
        },
        {
            url: '/feedback',
            priority: 0.3,
            changefreq: 'monthly' as const,
            title: 'Feedback & Support for Hypixel SkyBlock Tools',
            description: 'Submit feedback and get support for our Hypixel SkyBlock price tracking tools.',
            keywords: ['feedback', 'support', 'help', 'contact']
        }
    ] as SitemapPage[],

    // Item-specific SEO configuration
    itemConfig: {
        bazaarItems: {
            priority: 0.8,
            changefreq: 'hourly' as const,
            titleSuffix: 'Bazaar Price - Live Market Data',
            descriptionTemplate: (itemName: string) => 
                `Track ${itemName} bazaar prices with live market data, price history, and profit calculations for Hypixel SkyBlock.`,
            keywordTemplate: (itemName: string) => [
                `${itemName.toLowerCase()} price`,
                `${itemName.toLowerCase()} bazaar`,
                `${itemName.toLowerCase()} market`,
                'bazaar item'
            ]
        },
        auctionItems: {
            priority: 0.7,
            changefreq: 'daily' as const,
            titleSuffix: 'Auction Price - Historical Data & Trends',
            descriptionTemplate: (itemName: string) => 
                `Track ${itemName} auction prices with historical data, trends, and bidding analysis for Hypixel SkyBlock.`,
            keywordTemplate: (itemName: string) => [
                `${itemName.toLowerCase()} auction`,
                `${itemName.toLowerCase()} price`,
                `${itemName.toLowerCase()} history`,
                'auction item'
            ]
        }
    },

    // Cache settings for different sitemap types
    cacheSettings: {
        static: {
            maxAge: 7200, // 2 hours
            staleWhileRevalidate: 14400 // 4 hours
        },
        bazaar: {
            maxAge: 1800, // 30 minutes
            staleWhileRevalidate: 3600 // 1 hour
        },
        auction: {
            maxAge: 3600, // 1 hour
            staleWhileRevalidate: 7200 // 2 hours
        },
        combined: {
            maxAge: 3600, // 1 hour
            staleWhileRevalidate: 86400 // 24 hours
        }
    }
};

export function getFullUrl(path: string): string {
    const { baseUrl, basePath } = SITEMAP_CONFIG;
    return `${baseUrl}${basePath}${path}`;
}

export function generateItemSEO(item: { name: string; tag: string; flags: string | number }, isBazaar: boolean) {
    const config = isBazaar ? SITEMAP_CONFIG.itemConfig.bazaarItems : SITEMAP_CONFIG.itemConfig.auctionItems;
    
    return {
        title: `${item.name} ${config.titleSuffix} | Hypixel SkyBlock Price Tracker`,
        description: config.descriptionTemplate(item.name),
        keywords: [
            ...config.keywordTemplate(item.name),
            ...SITEMAP_CONFIG.globalKeywords,
            isBazaar ? 'bazaar tracking' : 'auction tracking'
        ].join(', ')
    };
}
