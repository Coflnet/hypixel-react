import { MetadataRoute } from 'next'

interface Item {
    tag: string;
    name: string;
    flags: string | number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sky.coflnet.com';
    const basePath = process.env.BASE_PATH || '';
    const fullBaseUrl = `${baseUrl}${basePath}`;

    // Static pages with SEO priorities
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: fullBaseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${fullBaseUrl}/flipper`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${fullBaseUrl}/auction`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${fullBaseUrl}/bazaar`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${fullBaseUrl}/flips`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.8,
        },
        {
            url: `${fullBaseUrl}/player`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${fullBaseUrl}/crafts`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${fullBaseUrl}/lowSupply`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.7,
        },
        {
            url: `${fullBaseUrl}/recentflips`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.7,
        },
        {
            url: `${fullBaseUrl}/npc`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
        {
            url: `${fullBaseUrl}/kat`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
        {
            url: `${fullBaseUrl}/trade`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
        {
            url: `${fullBaseUrl}/fusion`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
        {
            url: `${fullBaseUrl}/bookFlips`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
        {
            url: `${fullBaseUrl}/premium`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        {
            url: `${fullBaseUrl}/mod`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: `${fullBaseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${fullBaseUrl}/subscriptions`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.4,
        },
        {
            url: `${fullBaseUrl}/account`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${fullBaseUrl}/feedback`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        }
    ];

    try {
        // Fetch items from API for dynamic routes
        const itemsResponse = await fetch(`${baseUrl}/api/items`, {
            headers: {
                'User-Agent': 'Hypixel SkyBlock Price Tracker Sitemap Generator'
            }
        });

        let itemRoutes: MetadataRoute.Sitemap = [];
        
        if (itemsResponse.ok) {
            const items: Item[] = await itemsResponse.json();
            
            // Generate item routes with SEO optimization
            itemRoutes = items
                .filter(item => item.tag && item.name)
                .map((item): MetadataRoute.Sitemap[0] => {
                    const isBazaarItem = typeof item.flags === 'string' && item.flags.includes('BAZAAR');
                    
                    return {
                        url: `${fullBaseUrl}/item/${encodeURIComponent(item.tag)}`,
                        lastModified: new Date(),
                        changeFrequency: isBazaarItem ? 'hourly' : 'daily',
                        priority: isBazaarItem ? 0.8 : 0.7,
                    };
                })
                .slice(0, 45000); // Limit to stay within sitemap size limits
        }

        return [...staticRoutes, ...itemRoutes];
    } catch (error) {
        console.error('Error generating dynamic sitemap:', error);
        return staticRoutes; // Return static routes if API fails
    }
}
