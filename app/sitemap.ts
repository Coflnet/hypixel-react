import { MetadataRoute } from 'next'
import { SITEMAP_CONFIG, getFullUrl } from '../utils/sitemap-config'
import { generateGuideSitemapEntries, generateWikiSitemapEntries } from '../utils/sitemap-discovery'

interface Item {
    tag: string;
    name: string;
    flags: string | number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const today = new Date()
    const sitemapEntries: MetadataRoute.Sitemap = []

    // Add static pages
    const staticPages = SITEMAP_CONFIG.staticPages.map(page => ({
        url: getFullUrl(page.url),
        lastModified: today,
        changeFrequency: page.changefreq,
        priority: page.priority,
    }))
    
    sitemapEntries.push(...staticPages)

    // Add dynamically discovered guide pages
    try {
        const guideEntries = await generateGuideSitemapEntries('monthly', 0.7)
        const guidePages = guideEntries.map(entry => ({
            url: getFullUrl(entry.url),
            lastModified: entry.lastModified,
            changeFrequency: entry.changeFrequency,
            priority: entry.priority
        }))
        sitemapEntries.push(...guidePages)
        console.log(`Added ${guidePages.length} dynamically discovered guide pages to sitemap`)
    } catch (error) {
        console.error('Error adding guide pages to sitemap:', error)
    }

    // Add dynamically discovered wiki documentation pages
    try {
        const wikiEntries = await generateWikiSitemapEntries('monthly', 0.6)
        const wikiPages = wikiEntries.map(entry => ({
            url: getFullUrl(entry.url),
            lastModified: entry.lastModified,
            changeFrequency: entry.changeFrequency,
            priority: entry.priority
        }))
        sitemapEntries.push(...wikiPages)
        console.log(`Added ${wikiPages.length} dynamically discovered wiki docs to sitemap`)
    } catch (error) {
        console.error('Error adding wiki docs to sitemap:', error)
    }

    // Add auction items (limited for sitemap size)
    try {
        const auctionItems = await generateItemSitemap('auction')
        sitemapEntries.push(...auctionItems.slice(0, 15000)) // Limit for performance
    } catch (error) {
        console.error('Error adding auction items to sitemap:', error)
    }

    // Add bazaar items (limited for sitemap size)
    try {
        const bazaarItems = await generateItemSitemap('bazaar')
        sitemapEntries.push(...bazaarItems.slice(0, 15000)) // Limit for performance
    } catch (error) {
        console.error('Error adding bazaar items to sitemap:', error)
    }

    return sitemapEntries
}

// Helper function to generate item sitemaps
async function generateItemSitemap(type: 'auction' | 'bazaar'): Promise<MetadataRoute.Sitemap> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sky.coflnet.com'
        const response = await fetch(`${baseUrl}/api/items`)
        
        if (!response.ok) {
            console.error(`Failed to fetch items: ${response.status}`)
            return []
        }

        const items: Item[] = await response.json()
        const today = new Date()
        
        // Filter items based on type
        const filteredItems = items.filter(item => {
            const isBazaar = isBazaarItem(item)
            return type === 'bazaar' ? isBazaar : !isBazaar
        })

        const config = type === 'bazaar' 
            ? SITEMAP_CONFIG.itemConfig.bazaarItems 
            : SITEMAP_CONFIG.itemConfig.auctionItems

        return filteredItems.map(item => ({
            url: getFullUrl(`/item/${item.tag}`),
            lastModified: today,
            changeFrequency: config.changefreq,
            priority: config.priority,
        }))

    } catch (error) {
        console.error(`Error generating ${type} sitemap:`, error)
        return []
    }
}

// Helper function to check if item is bazaar item
function isBazaarItem(item: Item): boolean {
    if (typeof item.flags === 'number') {
        return (item.flags & 1) === 1
    }
    return typeof item.flags === 'string' && item.flags.includes('BAZAAR')
}
