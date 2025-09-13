import { NextRequest, NextResponse } from 'next/server';
import { sitemapGenerator } from '../../utils/sitemap-generator';

export async function GET(request: NextRequest) {
    const sitemapIndex = sitemapGenerator.generateSitemapIndex();

    return new NextResponse(sitemapIndex, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
