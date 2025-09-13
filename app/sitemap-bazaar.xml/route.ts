import { NextRequest, NextResponse } from 'next/server';
import { sitemapGenerator } from '../../utils/sitemap-generator';
import { SITEMAP_CONFIG } from '../../utils/sitemap-config';

export async function GET(request: NextRequest) {
    try {
        const sitemap = await sitemapGenerator.generateItemsSitemap('bazaar');

        return new NextResponse(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': `public, max-age=${SITEMAP_CONFIG.cacheSettings.bazaar.maxAge}, stale-while-revalidate=${SITEMAP_CONFIG.cacheSettings.bazaar.staleWhileRevalidate}`,
            },
        });
    } catch (error) {
        console.error('Error generating bazaar sitemap:', error);
        
        // Return empty sitemap if API fails
        const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

        return new NextResponse(emptySitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=300',
            },
        });
    }
}
