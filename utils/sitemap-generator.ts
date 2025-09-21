/**
 * Simplified sitemap utilities for automatic page detection and SEO optimization
 */

import { SITEMAP_CONFIG, getFullUrl, generateItemSEO } from './sitemap-config';

interface Item {
    tag: string;
    name: string;
    flags: string | number;
}

export class SitemapGenerator {
    private static instance: SitemapGenerator;
    private lastItemsFetch: number = 0;
    private cachedItems: Item[] = [];
    private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    static getInstance(): SitemapGenerator {
        if (!SitemapGenerator.instance) {
            SitemapGenerator.instance = new SitemapGenerator();
        }
        return SitemapGenerator.instance;
    }

    // Simple method to get all items with caching
    async getItems(): Promise<Item[]> {
        const now = Date.now();
        if (now - this.lastItemsFetch < this.CACHE_DURATION && this.cachedItems.length > 0) {
            return this.cachedItems;
        }

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sky.coflnet.com';
            const response = await fetch(`${baseUrl}/api/items`);
            if (!response.ok) {
                throw new Error(`Failed to fetch items: ${response.status}`);
            }
            
            this.cachedItems = await response.json();
            this.lastItemsFetch = now;
            return this.cachedItems;
        } catch (error) {
            console.error('Error fetching items:', error);
            return this.cachedItems; // Return cached items if available
        }
    }

    // Check if item is bazaar item (flags as number: 1=bazaar, string: 'BAZAAR')
    isBazaarItem(item: Item): boolean {
        if (typeof item.flags === 'number') {
            return (item.flags & 1) === 1;
        }
        return typeof item.flags === 'string' && item.flags.includes('BAZAAR');
    }

    // Generate simple XML sitemap
    generateXmlSitemap(urls: Array<{
        loc: string;
        lastmod: string;
        changefreq: string;
        priority: number;
    }>): string {
        const urlsXml = urls.map(url => `    <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
    </url>`).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlsXml}
</urlset>`;
    }

    // Generate static pages sitemap
    async generateStaticSitemap(): Promise<string> {
        const today = new Date().toISOString().split('T')[0];
        
        const urls = SITEMAP_CONFIG.staticPages.map(page => ({
            loc: getFullUrl(page.url),
            lastmod: today,
            changefreq: page.changefreq,
            priority: page.priority
        }));

        return this.generateXmlSitemap(urls);
    }

    // Generate items sitemap (auction or bazaar)
    async generateItemsSitemap(type: 'auction' | 'bazaar'): Promise<string> {
        const items = await this.getItems();
        const today = new Date().toISOString().split('T')[0];
        
        const filteredItems = items.filter(item => 
            type === 'bazaar' ? this.isBazaarItem(item) : !this.isBazaarItem(item)
        );

        const config = type === 'bazaar' 
            ? SITEMAP_CONFIG.itemConfig.bazaarItems 
            : SITEMAP_CONFIG.itemConfig.auctionItems;

        const urls = filteredItems.map(item => ({
            loc: getFullUrl(`/item/${item.tag}`),
            lastmod: today,
            changefreq: config.changefreq,
            priority: config.priority
        }));

        return this.generateXmlSitemap(urls);
    }

    // Generate combined sitemap with all pages and items
    async generateCombinedSitemap(): Promise<string> {
        const items = await this.getItems();
        const today = new Date().toISOString().split('T')[0];
        const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: number }> = [];

        // Add static pages
        SITEMAP_CONFIG.staticPages.forEach(page => {
            urls.push({
                loc: getFullUrl(page.url),
                lastmod: today,
                changefreq: page.changefreq,
                priority: page.priority
            });
        });

        // Add all items
        items.forEach(item => {
            const isBazaar = this.isBazaarItem(item);
            const config = isBazaar 
                ? SITEMAP_CONFIG.itemConfig.bazaarItems 
                : SITEMAP_CONFIG.itemConfig.auctionItems;
            
            urls.push({
                loc: getFullUrl(`/item/${item.tag}`),
                lastmod: today,
                changefreq: config.changefreq,
                priority: config.priority
            });
        });

        return this.generateXmlSitemap(urls);
    }

    // Generate sitemap index
    generateSitemapIndex(): string {
        const baseUrl = getFullUrl('');
        const today = new Date().toISOString().split('T')[0];
        
        const sitemaps = [
            'sitemap-pages.xml',
            'sitemap-items.xml', 
            'sitemap-bazaar.xml'
        ].map(filename => `    <sitemap>
        <loc>${baseUrl}/${filename}</loc>
        <lastmod>${today}</lastmod>
    </sitemap>`).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
    }
}

export const sitemapGenerator = SitemapGenerator.getInstance();
