import { Metadata } from 'next'

export const CANONICAL_DOMAIN = 'https://sky.coflnet.com'

// Players whose pages search engines should not index (e.g. on request of the player)
const NOINDEX_PLAYER_UUIDS = new Set(['17bdc3a6d75a44689c4fc1dbac8f09f5', 'ec0aba41fa0f47aeba9c8de21d9782e7'])

export function applyPlayerRobots(metadata: Metadata, uuid: string): Metadata {
    if (NOINDEX_PLAYER_UUIDS.has(uuid?.toLowerCase().replace(/-/g, ''))) {
        metadata.robots = {
            index: false,
            follow: true
        }
    }
    return metadata
}

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

/** Canonical URL of an item's archived auctions; the base64 filter is kept, encoded, as the only query parameter */
export function getArchiveCanonicalUrl(tag: string, filter?: string): string {
    return getCanonicalUrl(`/item/${tag}/archive`, filter ? `filter=${encodeURIComponent(filter)}` : undefined)
}

// What the site calls itself in the navbar; shown as og:site_name above every embed title
export const SITE_NAME = 'SkyCofl'

// Bootstrap "darkly" primary (--bs-primary in styles/bootstrap-dark.min.css), used for links and buttons
export const THEME_COLOR = '#375a7f'

export const DEFAULT_DESCRIPTION = 'Browse over 800 million auctions, and the bazaar of Hypixel SkyBlock.'
export const DEFAULT_EMBED_IMAGE = `${CANONICAL_DOMAIN}/logo512.png`

// Real pixel sizes of images we host. Unknown images get no size rather than a made up one.
const KNOWN_IMAGE_SIZES: Record<string, number> = {
    [`${CANONICAL_DOMAIN}/logo192.png`]: 192,
    [`${CANONICAL_DOMAIN}/logo512.png`]: 512
}

export interface EmbedOptions {
    /** real pixel size of the image; omitted sizes are left out of the meta tags */
    imageWidth?: number
    imageHeight?: number
    imageAlt?: string
    /** `summary` shows a small square thumbnail next to the text, which suits icons and heads */
    card?: 'summary' | 'summary_large_image'
    type?: 'website' | 'article' | 'profile'
    /** profile:username for og:type profile */
    username?: string
}

interface EmbedImage {
    url: string
    alt: string
    width?: number
    height?: number
}

function getEmbedImage(imageUrl: string | undefined, embedTitle: string, options: EmbedOptions): EmbedImage {
    const url = imageUrl || DEFAULT_EMBED_IMAGE
    const knownSize = KNOWN_IMAGE_SIZES[url]
    const width = options.imageWidth ?? knownSize
    const height = options.imageHeight ?? knownSize
    const alt = options.imageAlt || (knownSize ? `${SITE_NAME} logo` : embedTitle)
    return { url, alt, ...(width && height ? { width, height } : {}) }
}

function getOpenGraph(embedTitle: string, description: string, image: EmbedImage, canonicalUrl: string | undefined, options: EmbedOptions): Metadata['openGraph'] {
    const base = {
        title: embedTitle,
        description: description,
        siteName: SITE_NAME,
        images: [image],
        ...(canonicalUrl && { url: canonicalUrl })
    }
    if (options.type === 'profile') {
        return { ...base, type: 'profile', ...(options.username && { username: options.username }) }
    }
    return { ...base, type: options.type || 'website' }
}

export function getHeadMetadata(
    title: string = 'Skyblock Auction House History | Hypixel SkyBlock AH history',
    description: string = DEFAULT_DESCRIPTION,
    imageUrl: string | undefined = DEFAULT_EMBED_IMAGE,
    // Historically some call sites passed the canonical URL in place of keywords.
    // Accept either an array of keywords or a string canonical URL for backwards compatibility.
    keywordsOrCanonical: string[] | string | undefined = [],
    embedTitle: string = 'Skyblock Auction House History | Hypixel SkyBlock AH history',
    canonicalUrl?: string,
    embedOptions: EmbedOptions = {}
): Metadata {
    // Normalize arguments: if keywordsOrCanonical is a string, treat it as canonicalUrl
    let keywordsArr: string[] = []
    let finalCanonical: string | undefined = canonicalUrl

    if (typeof keywordsOrCanonical === 'string') {
        finalCanonical = keywordsOrCanonical
    } else if (Array.isArray(keywordsOrCanonical)) {
        keywordsArr = keywordsOrCanonical
    }

    const finalDescription = description || DEFAULT_DESCRIPTION
    const image = getEmbedImage(imageUrl, embedTitle, embedOptions)

    return {
        title: title,
        description: finalDescription,
        manifest: '/manifest.json',
        openGraph: getOpenGraph(embedTitle, finalDescription, image, finalCanonical, embedOptions),
        twitter: {
            card: embedOptions.card || 'summary',
            title: embedTitle,
            description: finalDescription,
            images: [image]
        },
        keywords: [...keywordsArr, 'hypixel', 'skyblock', 'auction', 'history', 'bazaar', 'tracker'].join(','),
        ...(finalCanonical && { alternates: { canonical: finalCanonical } })
    }
}
