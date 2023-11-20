import { Metadata } from 'next'

export function isClientSideRendering() {
    return typeof window !== 'undefined'
}

export function getHeadMetadata(
    title: string = 'Skyblock Auction House History | Hypixel SkyBlock AH history',
    description: string = 'Browse over 600 million auctions, and the bazaar of Hypixel SkyBlock.',
    imageUrl: string = 'https://sky.coflnet.com/logo192.png',
    keywords: string[] = [],
    embedTitle: string = 'Skyblock Auction House History | Hypixel SkyBlock AH history'
): Metadata {
    return {
        title: title,
        description: description,
        manifest: '/manifest.json',
        themeColor: {
            color: '#000000'
        },
        viewport: {
            width: 'device-width, initial-scale=1'
        },
        openGraph: {
            title: embedTitle,
            description: description,
            images: {
                url: imageUrl,
                height: 64,
                width: 64
            }
        },
        keywords: [...keywords, 'hypixel', 'skyblock', 'auction', 'history', 'bazaar', 'tracker'].join(',')
    }
}
