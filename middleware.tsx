import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import api from './api/ApiHelper'

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
    // Handle player redirects (existing functionality)
    if (req.nextUrl.pathname.startsWith('/player')) {
        const url = req.nextUrl.clone()
        let split = url.pathname.split('/')

        // special case for people searching a hyauction account
        if (
            req.headers.get('referer')?.includes('google.com') &&
            (split[2] === 'be7002531956406d81c535a81fe2833a' ||
                split[2] === '903fe3366f8548b493f2524433b180f4?' ||
                split[2] === 'c7aee75e6ee4437ab0e143a8836176a8')
        ) {
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        if (split[2].length < 30) {
            await api
                .playerSearch(split[2])
                .then(players => {
                    split[2] = players[0].uuid
                })
                .catch(() => {
                    split[2] = ''
                })
            url.pathname = split.join('/')
            return NextResponse.redirect(url)
        }
    }

    // Get the response
    const response = NextResponse.next()
    
    // Add SEO and sitemap headers for better search engine optimization
    const pathname = req.nextUrl.pathname;
    
    // Add sitemap links to all HTML responses
    if (!pathname.startsWith('/api/') && 
        !pathname.startsWith('/_next/') && 
        !pathname.includes('.xml') &&
        !pathname.includes('.txt')) {
        
        const sitemapLinks = [
            '</sitemap-index.xml>; rel="sitemap"; type="application/xml"',
            '</sitemap.xml>; rel="sitemap"; type="application/xml"'
        ];
        
        // Add specific sitemap links for item pages
        if (pathname.startsWith('/item/')) {
            sitemapLinks.push(
                '</sitemap-items.xml>; rel="sitemap"; type="application/xml"',
                '</sitemap-bazaar.xml>; rel="sitemap"; type="application/xml"'
            );
        }
        
        response.headers.set('Link', sitemapLinks.join(', '));
    }
    
    // Add robots meta tags for SEO-important pages
    if (pathname === '/' || 
        pathname.startsWith('/flipper') || 
        pathname.startsWith('/auction') || 
        pathname.startsWith('/bazaar') ||
        pathname.startsWith('/item/') ||
        pathname.startsWith('/player/')) {
        
        response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }
    
    // Add cache headers for sitemap files
    if (pathname.includes('sitemap') && pathname.endsWith('.xml')) {
        response.headers.set('Content-Type', 'application/xml');
        response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }

    return response
}
