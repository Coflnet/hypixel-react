import { NextRequest, NextResponse } from 'next/server';
import { sitemapGenerator } from '../../utils/sitemap-generator';
import { SITEMAP_CONFIG } from '../../utils/sitemap-config';

export async function GET(request: NextRequest) {
    try {
        const sitemap = await sitemapGenerator.generateStaticSitemap();

        return new NextResponse(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': `public, max-age=${SITEMAP_CONFIG.cacheSettings.static.maxAge}, stale-while-revalidate=${SITEMAP_CONFIG.cacheSettings.static.staleWhileRevalidate}`,
            },
        });
    } catch (error) {
        console.error('Error generating static pages sitemap:', error);
        
        // Return minimal sitemap on error
        const errorSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${SITEMAP_CONFIG.baseUrl}${SITEMAP_CONFIG.basePath}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>`;

        return new NextResponse(errorSitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=300',
            },
        });
    }
}
