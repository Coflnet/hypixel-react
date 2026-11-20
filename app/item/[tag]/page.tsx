import type { AveragePrice } from '../../../api/_generated/skyApi.schemas'
import type { Metadata } from 'next'
import { parseItem } from '../../../utils/Parser/APIResponseParser'
import { getHeadMetadata, getCanonicalUrl } from '../../../utils/SSRUtils'
import { convertTagToName } from '../../../utils/Formatter'
import api from '../../../api/ApiHelper'
import dynamic from 'next/dynamic'
import { ItemPageClient } from './ItemPageClient'
import { getEnchantmentRename } from '../../../utils/EnchantmentRenames'
import { getBuiltTaskLinks } from '../../../utils/ItemTaskSourcesData'
import { getAuctionItemEmbedDescription, getBazaarItemEmbedDescription, getItemFilterEmbedText, joinEmbedParts } from '../../../utils/EmbedUtils'
import { getKnownItemFilter } from '../../../utils/KnownItemFilter'
import { DiscordEmbedLink } from '../../../components/DiscordEmbed/DiscordEmbedLink'
import { toSearchString } from '../../../utils/DiscordEmbedLink'
import { getItemData, getItemDisplayName, isBazaarItemData, type ItemPageData } from './itemData'

const BazaarPriceGraph = dynamic(() => import('../../../components/PriceGraph/BazaarPriceGraph/BazaarPriceGraph'), {
    loading: () => <div style={{ minHeight: '300px' }}>Loading chart...</div>
})

const AuctionHousePriceGraph = dynamic(() => import('../../../components/PriceGraph/AuctionHousePriceGraph/AuctionHousePriceGraph'), {
    loading: () => <div style={{ minHeight: '300px' }}>Loading chart...</div>
})

const NitroAdSlot = dynamic(() => import('../../../components/Ads/NitroAdSlot'), {
    loading: () => <div style={{ minHeight: '90px' }} />
})

const ItemFAQ = dynamic(() => import('../../../components/ItemFAQ/ItemFAQ'), {
    loading: () => <div style={{ minHeight: '200px' }}>Loading...</div>
})

const RelatedItems = dynamic(() => import('../../../components/RelatedItems/RelatedItems'), {
    loading: () => <div style={{ minHeight: '100px' }} />
})

// Revalidate every 600 seconds (10 minutes) for price data freshness
// Note: Shorter revalidation times can cause hydration mismatches in some cases
export const revalidate = 600

// Enable static params optimization for popular items
export const dynamicParams = true

export default async function Page(props) {
    const params = await props.params
    const searchParams = await props.searchParams
    const tag = params.tag as string

    const data = await getItemData(searchParams, params)
    const item = parseItem(data.item)

    const isBazaar = data.itemFlags?.isBazaar ?? false
    const enchantmentRename = getEnchantmentRename(tag)

    function getItem(): Item {
        return (
            item ||
            parseItem({
                tag: tag,
                itemName: data.itemFlags?.name || convertTagToName(tag),
                iconUrl: api.getItemImageUrl({ tag }),
                flags: data.itemFlags?.flags
            })
        )
    }

    return (
        <>
            <DiscordEmbedLink segments={['item', tag]} search={toSearchString(searchParams)} />
            <ItemPageClient item={getItem()}>
                {enchantmentRename && (
                    <p>
                        <strong>
                            {enchantmentRename.currentName} {enchantmentRename.level}
                        </strong>{' '}
                        uses the legacy/internal item name{' '}
                        <strong>
                            {enchantmentRename.previousName} {enchantmentRename.level}
                        </strong>{' '}
                        in Hypixel SkyBlock. This page tracks the same enchantment under both names.
                    </p>
                )}
                {isBazaar ? <BazaarPriceGraph item={getItem()} /> : <AuctionHousePriceGraph item={getItem()} />}

                <NitroAdSlot
                    slotId="flip-banner"
                    config={{
                        delayLoading: true,
                        report: {
                            enabled: true,
                            icon: true,
                            wording: 'Report Ad',
                            position: 'bottom-right'
                        }
                    }}
                />
                <ItemFAQ
                    item={getItem()}
                    tag={tag}
                    range={data.range}
                    prices={data.prices}
                    isBazaar={isBazaar}
                    itemFlags={data.itemFlags || null}
                    taskSources={getBuiltTaskLinks(tag)}
                />
                <RelatedItems tag={tag} isBazaarItem={isBazaar} />
            </ItemPageClient>
            <NitroAdSlot
                slotId="below-faq"
                config={{
                    delayLoading: true,
                    report: {
                        enabled: true,
                        icon: true,
                        wording: 'Report Ad',
                        position: 'bottom-right'
                    }
                }}
            />
        </>
    )
}

export async function generateMetadata(props): Promise<Metadata> {
    const searchParams = await props.searchParams
    const params = await props.params
    const tag = params?.tag as string
    const { item, filter, prices, range, itemFlags } = await getItemData(searchParams, params)
    const enchantmentRename = getEnchantmentRename(tag)
    const itemName = getItemDisplayName(tag, item, itemFlags)
    const metadataName = enchantmentRename
        ? `${enchantmentRename.currentName} ${enchantmentRename.level} (legacy ${enchantmentRename.previousName} ${enchantmentRename.level})`
        : itemName
    const keywords = [
        convertTagToName(item.tag ?? undefined),
        ...(enchantmentRename
            ? [
                  enchantmentRename.currentName,
                  enchantmentRename.previousName,
                  `${enchantmentRename.currentName} ${enchantmentRename.level}`,
                  `${enchantmentRename.previousName} ${enchantmentRename.level}`
              ]
            : [])
    ]
    const isBazaar = isBazaarItemData(item, itemFlags)
    // only filter keys the item really has, so tracking params like fbclid never show up
    const knownFilter = filter ? await getKnownItemFilter(tag, filter) : null
    return getHeadMetadata(
        `${metadataName} price`,
        getItemDescription(itemName, isBazaar, prices, range, knownFilter, enchantmentRename),
        item.iconUrl || api.getItemImageUrl({ tag }),
        keywords,
        `${metadataName} | ${isBazaar ? 'Bazaar' : 'SkyBlock'} Price`,
        getCanonicalUrl(`/item/${tag}`),
        // item icons are 16x16 to 64x64 depending on the item, so no size is claimed
        { imageAlt: `${itemName} icon` }
    )
}

function getItemDescription(
    itemName: string,
    isBazaar: boolean,
    prices: ItemPageData['prices'],
    range: string | null,
    filter: ItemFilter | null,
    enchantmentRename: ReturnType<typeof getEnchantmentRename>
): string {
    const renameDescription = enchantmentRename
        ? `${enchantmentRename.currentName} ${enchantmentRename.level} uses the legacy/internal item name ${enchantmentRename.previousName} ${enchantmentRename.level} in Hypixel SkyBlock. `
        : ''
    const stats = isBazaar ? getBazaarItemEmbedDescription(prices as BazaarPrice[]) : getAuctionItemEmbedDescription(prices as AveragePrice[], range)
    const details = joinEmbedParts([stats, getItemFilterEmbedText(filter)])
    return `${renameDescription}${details || `Price history of ${itemName} in Hypixel SkyBlock.`}`
}

