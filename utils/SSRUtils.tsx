import { Metadata } from 'next'

export const CANONICAL_DOMAIN = 'https://sky.coflnet.com'

export function isClientSideRendering() {
    return typeof window !== 'undefined'
}

/**
 * Generates a canonical URL for sky.coflnet.com based on the provided pathname and optional search string.
 * This ensures search engines treat sky.coflnet.com as the canonical version regardless of
 * which domain variant the page is served from (skyblock.coflnet.com, sky-commands.coflnet.com, etc.)
 */
export function getCanonicalUrl(pathname: string, search?: string): string {
    // Ensure pathname starts with /
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
    const searchString = search ? `?${search}` : ''
    return `${CANONICAL_DOMAIN}${normalizedPath}${searchString}`
}

export function getHeadMetadata(
    title: string = 'Skyblock Auction House History | Hypixel SkyBlock AH history',
    description: string = 'Browse over 800 million auctions, and the bazaar of Hypixel SkyBlock.',
    imageUrl: string = 'https://sky.coflnet.com/logo192.png',
    keywords: string[] = [],
    embedTitle: string = 'Skyblock Auction House History | Hypixel SkyBlock AH history',
    canonicalUrl?: string
): Metadata {
    return {
        title: title,
        description: description,
        manifest: '/manifest.json',
        openGraph: {
            title: embedTitle,
            description: description,
            images: {
                url: imageUrl,
                height: 64,
                width: 64
            }
        },
        keywords: [...keywords, 'hypixel', 'skyblock', 'auction', 'history', 'bazaar', 'tracker'].join(','),
        ...(canonicalUrl && { alternates: { canonical: canonicalUrl } })
    }
}
