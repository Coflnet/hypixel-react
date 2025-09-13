import { NextRequest, NextResponse } from 'next/server';
import { sitemapGenerator } from '../../utils/sitemap-generator';
import { SITEMAP_CONFIG } from '../../utils/sitemap-config';

export async function GET(request: NextRequest) {
    try {
        const sitemap = await sitemapGenerator.generateCombinedSitemap();
        
        return new NextResponse(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': `public, max-age=${SITEMAP_CONFIG.cacheSettings.combined.maxAge}, stale-while-revalidate=${SITEMAP_CONFIG.cacheSettings.combined.staleWhileRevalidate}`,
            },
        });
    } catch (error) {
        console.error('Error generating combined sitemap:', error);
        
        // Return a basic sitemap with just static pages if generation fails
        const basicSitemap = await sitemapGenerator.generateStaticSitemap();
        
        return new NextResponse(basicSitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=300', // Shorter cache on error
            },
        });
    }
}
