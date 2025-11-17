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
            url: '/reverseNpc',
            priority: 0.6,
            changefreq: 'daily' as const,
            title: 'Reverse NPC Flip Tracker & Guaranteed Profit Calculator',
            description: 'Track reverse NPC flip opportunities where you buy from players and sell to vendors for guaranteed coins.',
            keywords: ['reverse npc flips', 'vendor flips', 'npc profit', 'hypixel skyblock flips']
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
        {
            url: '/attributeFlips',
            priority: 0.8,
            changefreq: 'hourly' as const,
            title: 'Attribute Item Upgrade Flips Profit Calculator',
            description: 'Identify profitable Hypixel SkyBlock attribute flips by comparing base auction costs, upgrade materials, and target sale prices.',
            keywords: ['attribute flips', 'item upgrades', 'attribute shards', 'hypixel attributes', 'hex upgrades']
        },
        {
            url: '/mayor',
            priority: 0.7,
            changefreq: 'daily' as const,
            title: 'Mayor Flips - Election Price Prediction & Historic Analysis',
            description: 'Maximize profits with Hypixel SkyBlock mayor flips! Discover items predicted to change value when the next mayor is elected based on historic price data.',
            keywords: ['mayor flips', 'hypixel skyblock', 'mayor election', 'derpy mayor', 'diana mayor', 'price prediction', 'election profit', 'historic prices']
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
        },
        // Flipping Guides
        {
            url: '/guides',
            priority: 0.8,
            changefreq: 'weekly' as const,
            title: 'Complete Hypixel Skyblock Flipping Guides | Learn Bazaar & Auction House Strategies',
            description: 'Master Hypixel Skyblock flipping with our comprehensive guides. Learn bazaar flipping, auction house strategies, profit tracking, scam prevention, and advanced money-making methods.',
            keywords: ['flipping guides', 'bazaar guide', 'auction house guide', 'skyblock flipping', 'money making']
        },
        {
            url: '/guides/what-is-bazaar-flipping',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'What is Bazaar Flipping? Guide to Basics',
            description: 'Understand the basics of bazaar flipping and how it works in Hypixel Skyblock.',
            keywords: ['bazaar flipping', 'flipping basics', 'bazaar trading']
        },
        {
            url: '/guides/getting-started-with-flipping',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'How to Get Started with Flipping in Hypixel Skyblock',
            description: 'Your first steps into the world of Hypixel Skyblock flipping. A complete beginner\'s guide.',
            keywords: ['flipping for beginners', 'getting started', 'beginner guide']
        },
        {
            url: '/guides/how-to-start-flipping-with-no-money',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'How to Start Flipping with No Money - Zero Coins Guide',
            description: 'Begin your Hypixel Skyblock flipping journey even with zero coins. Complete guide for broke players.',
            keywords: ['flipping with no money', 'zero coins', 'poor flipping', 'broke player guide']
        },
        {
            url: '/guides/how-to-flip',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'How to Flip on Hypixel Skyblock - Complete Guide',
            description: 'Complete guide to flipping mechanics and strategies for Hypixel Skyblock.',
            keywords: ['how to flip', 'flipping guide', 'flipping mechanics', 'skyblock flipping']
        },
        {
            url: '/guides/is-flipping-worth-it',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'Is It Worth It to Flip in Hypixel Skyblock?',
            description: 'Understand the time investment and potential returns from flipping in Hypixel Skyblock.',
            keywords: ['is flipping worth it', 'flipping profitability', 'flipping time investment']
        },
        {
            url: '/guides/best-item-to-flip',
            priority: 0.7,
            changefreq: 'weekly' as const,
            title: 'What is the Best Item to Flip? Characteristics of Profitable Items',
            description: 'Learn the characteristics of profitable items and how to identify the best items to flip.',
            keywords: ['best item to flip', 'profitable items', 'item selection']
        },
        {
            url: '/guides/best-item-to-flip-right-now',
            priority: 0.8,
            changefreq: 'daily' as const,
            title: 'What is the Best Item to Flip Right Now?',
            description: 'Discover the best items to flip right now using real-time tools and market analysis.',
            keywords: ['best item to flip now', 'current flips', 'trending items']
        },
        {
            url: '/guides/how-to-find-best-items-to-flip',
            priority: 0.7,
            changefreq: 'weekly' as const,
            title: 'How to Find the Best Items to Flip - Strategies and Tools',
            description: 'Master strategies and tools for discovering profitable items in Hypixel Skyblock.',
            keywords: ['find items to flip', 'flipping strategies', 'item discovery']
        },
        {
            url: '/guides/largest-bazaar-margins',
            priority: 0.7,
            changefreq: 'weekly' as const,
            title: 'Which Items Have the Largest Bazaar Margins?',
            description: 'Discover high-margin items for maximum profit in Hypixel Skyblock bazaar trading.',
            keywords: ['bazaar margins', 'high margin items', 'profit maximization']
        },
        {
            url: '/guides/starter-items-under-10m',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'Best Starter Items for Players Under 10M Coins',
            description: 'Accessible flipping opportunities for newer players with less than 10 million coins.',
            keywords: ['starter items', 'beginner flips', 'low capital flipping']
        },
        {
            url: '/guides/best-flipping-strategy',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'What is the Best Flipping Strategy? Compare Approaches',
            description: 'Compare different flipping strategies and find what works best for your playstyle.',
            keywords: ['flipping strategy', 'best strategy', 'strategy comparison']
        },
        {
            url: '/guides/bazaar-vs-auction-house',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'Bazaar vs. Auction House Flipping - Key Differences',
            description: 'Understand the differences between bazaar and auction house flipping and when to use each.',
            keywords: ['bazaar vs auction house', 'flipping comparison', 'auction house flipping']
        },
        {
            url: '/guides/how-to-make-money-with-bazaar-flipping',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'How to Make Money with Bazaar Flipping',
            description: 'Specific strategies for bazaar success and maximizing profits.',
            keywords: ['bazaar money making', 'bazaar profits', 'bazaar strategies']
        },
        {
            url: '/guides/making-a-lot-of-money-with-flipping',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'How to Make a Lot of Money with Flipping',
            description: 'Advanced techniques for serious profit in Hypixel Skyblock flipping.',
            keywords: ['make money flipping', 'advanced flipping', 'serious profits']
        },
        {
            url: '/guides/money-making-methods',
            priority: 0.7,
            changefreq: 'weekly' as const,
            title: 'Best Money Making Methods in Hypixel Skyblock',
            description: 'Comprehensive profit strategies beyond flipping for Hypixel Skyblock.',
            keywords: ['money making', 'profit methods', 'skyblock income']
        },
        {
            url: '/guides/optimal-minion-setups',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'Optimal Minion Setups for Passive Income',
            description: 'Passive income strategies with optimal minion configurations to complement your flipping.',
            keywords: ['minion setups', 'passive income', 'minion guide']
        },
        {
            url: '/guides/avoid-taxes-and-losses',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'How to Avoid Flipping Taxes and Transfer Losses',
            description: 'Minimize costs and transfer losses to maximize your net profit in Hypixel Skyblock.',
            keywords: ['avoid taxes', 'transfer losses', 'minimize costs']
        },
        {
            url: '/guides/tracking-profits-automatically',
            priority: 0.7,
            changefreq: 'monthly' as const,
            title: 'How to Track Your Profits Automatically',
            description: 'Use automated tools to monitor your flip performance and profit in Hypixel Skyblock.',
            keywords: ['profit tracking', 'profit calculator', 'automatic tracking']
        },
        {
            url: '/guides/safe-tracker-tools',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'Safe and Reliable Third-Party Tracker Tools',
            description: 'Approved tools for tracking that won\'t get you banned in Hypixel Skyblock.',
            keywords: ['safe tools', 'tracker tools', 'approved mods']
        },
        {
            url: '/guides/how-to-avoid-scams',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'How to Avoid Scams While Flipping in Hypixel Skyblock',
            description: 'Protect yourself from common scams while flipping in Hypixel Skyblock.',
            keywords: ['avoid scams', 'scam prevention', 'trading safety']
        },
        {
            url: '/guides/automating-flips',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'Automating Hypixel Skyblock Flips: Tools, Risks, and Safe Alternatives',
            description: 'Understanding automation and why you should avoid it. Safe alternatives for automated profit.',
            keywords: ['automating flips', 'bot risks', 'automation dangers']
        },
        {
            url: '/guides/buying-skyblock-coins',
            priority: 0.6,
            changefreq: 'monthly' as const,
            title: 'Buying Hypixel Skyblock Coins: Risks, Bans, and Safe Alternatives',
            description: 'Why buying coins is dangerous and safe alternatives for building capital.',
            keywords: ['buying coins', 'coin risks', 'ban risks']
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
