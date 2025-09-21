/**
 * Middleware to handle automatic sitemap updates when new pages are detected
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    
    // Add sitemap headers to all responses for better SEO
    const response = NextResponse.next();
    
    // Add sitemap links to HTML pages
    if (url.pathname === '/' || url.pathname.startsWith('/item/') || url.pathname.startsWith('/player/')) {
        response.headers.set('Link', [
            '</sitemap-index.xml>; rel="sitemap"; type="application/xml"',
            '</sitemap.xml>; rel="sitemap"; type="application/xml"'
        ].join(', '));
    }
    
    // For item pages, add specific sitemap references
    if (url.pathname.startsWith('/item/')) {
        const currentSitemapLinks = response.headers.get('Link') || '';
        const additionalLinks = [
            '</sitemap-items.xml>; rel="sitemap"; type="application/xml"',
            '</sitemap-bazaar.xml>; rel="sitemap"; type="application/xml"'
        ];
        
        const allLinks = currentSitemapLinks ? 
            `${currentSitemapLinks}, ${additionalLinks.join(', ')}` : 
            additionalLinks.join(', ');
            
        response.headers.set('Link', allLinks);
    }
    
    // Add robots meta tag to encourage indexing of important pages
    if (url.pathname === '/' || 
        url.pathname.startsWith('/flipper') || 
        url.pathname.startsWith('/auction') || 
        url.pathname.startsWith('/bazaar') ||
        url.pathname.startsWith('/item/')) {
        
        response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }
    
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - sitemap files (avoid infinite loops)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap|robots.txt).*)',
    ],
};
