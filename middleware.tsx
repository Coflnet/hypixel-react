import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import api from './api/ApiHelper'

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
    // Handle player redirects (existing functionality)
    if (req.nextUrl.pathname.startsWith('/player')) {
        const url = req.nextUrl.clone()
        let split = url.pathname.split('/')

        if (!split[2]) {
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

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
                .then((players: any) => {
                    split[2] = players[0].uuid
                })
                .catch(() => {
                    split[2] = ''
                })
            url.pathname = split.join('/')
            return NextResponse.redirect(url)
        }
    }

    const response = NextResponse.next()
    const url = req.nextUrl.clone();
    if (!req.cookies.get('CCPAOPTOUT')) {
        response.cookies.set('CCPAOPTOUT', '1');
    }

    if (url.pathname === '/' || url.pathname.startsWith('/item/') || url.pathname.startsWith('/player/')) {
        response.headers.set('Link', [
            '</sitemap-index.xml>; rel="sitemap"; type="application/xml"',
            '</sitemap.xml>; rel="sitemap"; type="application/xml"'
        ].join(', '));
    }

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

    if (url.pathname === '/' ||
        url.pathname.startsWith('/flipper') ||
        url.pathname.startsWith('/auction') ||
        url.pathname.startsWith('/bazaar') ||
        url.pathname.startsWith('/item/')) {

        response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    if (url.pathname.includes('sitemap') && url.pathname.endsWith('.xml')) {
        response.headers.set('Content-Type', 'application/xml');
        response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }

    return response
}

export const config = {
    matcher: ['/', '/player/:path*', '/item/:path*', '/flipper/:path*', '/auction/:path*', '/bazaar/:path*', '/(.*sitemap.*\\.xml)']
}
