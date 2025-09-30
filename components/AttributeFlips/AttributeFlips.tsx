'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import moment from 'moment'
import { Alert, Badge, Button } from 'react-bootstrap'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import api from '../../api/ApiHelper'
import Number from '../Number/Number'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { convertTagToName, getStyleForTier } from '../../utils/Formatter'
import {
    fetchAttributeFlips,
    type AttributeFlip,
    type AttributeFlipApiResponse,
    type AttributeFlipAuctionKey,
    type AttributeFlipIngredient,
    type AttributeFlipModifier
} from '../../api/attributeFlips'
import styles from './AttributeFlips.module.css'

const SORT_OPTIONS: SortOption<AttributeFlip>[] = [
    {
        label: 'Profit ⇧',
        value: 'profitDesc',
        sortFunction: flips => flips.sort((a, b) => getProfit(b) - getProfit(a))
    },
    {
        label: 'Profit ⇩',
        value: 'profitAsc',
        sortFunction: flips => flips.sort((a, b) => getProfit(a) - getProfit(b))
    },
    {
        label: 'Total Cost ⇩',
        value: 'costAsc',
        sortFunction: flips => flips.sort((a, b) => getTotalCost(a) - getTotalCost(b))
    },
    {
        label: 'Sale Price ⇧',
        value: 'saleDesc',
        sortFunction: flips => flips.sort((a, b) => b.target - a.target)
    },
    {
        label: 'Volume ⇧',
        value: 'volumeDesc',
        sortFunction: flips => flips.sort((a, b) => b.volume - a.volume)
    },
    {
        label: 'Found Recently',
        value: 'newest',
        sortFunction: flips => flips.sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime())
    }
]

function getTotalCost(flip: AttributeFlip): number {
    return flip.auctionPrice + flip.estimatedCraftingCost
}

function getProfit(flip: AttributeFlip): number {
    return flip.target - getTotalCost(flip)
}

function getDisplayName(flip: AttributeFlip): string {
    return flip.itemName ?? convertTagToName(flip.tag ?? '')
}

function formatModifier(modifier: AttributeFlipModifier): string {
    const label = convertTagToName(modifier.key ?? '')
    return modifier.value ? `${label} ${modifier.value}` : label
}

function renderAuctionKey(title: string, key?: AttributeFlipAuctionKey) {
    if (!key) {
        return null
    }

    const { reforge, tier, enchants, modifiers, count } = key

    return (
        <div className={styles.keyCard}>
            <div className={styles.keyTitle}>{title}</div>
            {reforge ? <p className={styles.keyLine}><span className={styles.muted}>Reforge:</span> {convertTagToName(reforge)}</p> : null}
            {tier ? (
                <p className={styles.keyLine}>
                    <span className={styles.muted}>Tier:</span>{' '}
                    <span style={getStyleForTier(tier)} className={styles.tierLabel}>
                        {convertTagToName(String(tier))}
                    </span>
                </p>
            ) : null}
            <p className={styles.keyLine}><span className={styles.muted}>Stack Size:</span> {count}</p>
            {enchants && enchants.length > 0 ? (
                <div className={styles.badgeRow}>
                    {enchants.map(enchant => (
                        <Badge bg="info" key={`${enchant.type}-${enchant.lvl}`}>
                            {`${convertTagToName(enchant.type ?? '')} ${enchant.lvl}`}
                        </Badge>
                    ))}
                </div>
            ) : null}
            {modifiers && modifiers.length > 0 ? (
                <div className={styles.badgeRow}>
                    {modifiers.map(modifier => (
                        <Badge bg="secondary" key={`${modifier.key}-${modifier.value}`}>
                            {formatModifier(modifier)}
                        </Badge>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function renderIngredient(ingredient: AttributeFlipIngredient, index: number) {
    const iconTag = ingredient.itemId || undefined
    const label = ingredient.itemId ? convertTagToName(ingredient.itemId) : convertTagToName(ingredient.attributeName ?? '')
    const amount = ingredient.amount

    return (
        <li className={styles.ingredientItem} key={`${iconTag}-${index}`}>
            {iconTag ? (
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl({ tag: iconTag } as any) || ''}
                    height={32}
                    width={32}
                    alt=""
                    loading="lazy"
                />
            ) : null}
            <span className={styles.ingredientName}>{label || 'Ingredient'}</span>
            <Badge bg="dark">×{amount}</Badge>
            <Badge bg="success"><Number number={Math.round(ingredient.price)} /> Coins</Badge>
        </li>
    )
}

function renderFlipContent(flip: AttributeFlip) {
    const totalCost = getTotalCost(flip)
    const profit = getProfit(flip)
    const name = getDisplayName(flip)
    const iconTag = flip.tag ?? undefined

    return (
        <div className={styles.attributeFlips}>
            <div className={styles.flipHeader}>
                {iconTag ? (
                    <Image
                        crossOrigin="anonymous"
                        src={api.getItemImageUrl({ tag: iconTag } as any) || ''}
                        height={48}
                        width={48}
                        alt=""
                        loading="lazy"
                    />
                ) : null}
                <div>
                    <h4 className={styles.itemTitle}>{name || 'Unknown Item'}</h4>
                    <div className={styles.timeInfo}>Found {moment(flip.foundAt).fromNow()}</div>
                </div>
            </div>
            <div className={styles.metaGrid}>
                <div className={styles.metaCard}>
                    <span className={styles.metaLabel}>Estimated Profit</span>
                    <span className={styles.metaValue}>
                        <Number number={Math.round(profit)} /> Coins
                    </span>
                </div>
                <div className={styles.metaCard}>
                    <span className={styles.metaLabel}>Sale Price</span>
                    <span className={styles.metaValue}>
                        <Number number={Math.round(flip.target)} /> Coins
                    </span>
                </div>
                <div className={styles.metaCard}>
                    <span className={styles.metaLabel}>Base Auction</span>
                    <span className={styles.metaValue}>
                        <Number number={Math.round(flip.auctionPrice)} /> Coins
                    </span>
                </div>
                <div className={styles.metaCard}>
                    <span className={styles.metaLabel}>Upgrade Costs</span>
                    <span className={styles.metaValue}>
                        <Number number={Math.round(flip.estimatedCraftingCost)} /> Coins
                    </span>
                </div>
                <div className={styles.metaCard}>
                    <span className={styles.metaLabel}>Total Cost</span>
                    <span className={styles.metaValue}>
                        <Number number={Math.round(totalCost)} /> Coins
                    </span>
                </div>
                <div className={styles.metaCard}>
                    <span className={styles.metaLabel}>Market Volume</span>
                    <span className={styles.metaValue}>
                        <Number number={Math.round(flip.volume)} /> / week
                    </span>
                </div>
            </div>

            {(flip.startingKey || flip.endingKey) ? (
                <div className={`${styles.section} ${styles.keyGrid}`}>
                    {renderAuctionKey('Starting Item', flip.startingKey)}
                    {renderAuctionKey('Finished Item', flip.endingKey)}
                </div>
            ) : null}

            {flip.ingredients && flip.ingredients.length > 0 ? (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Upgrade Materials</div>
                    <ul className={styles.ingredientList}>{flip.ingredients.map(renderIngredient)}</ul>
                </div>
            ) : null}
        </div>
    )
}

function filterAttributeFlip(flip: AttributeFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
    const profitMatch = getProfit(flip) >= minimumProfit

    if (!nameFilter) {
        return profitMatch
    }

    const search = nameFilter.toLowerCase()
    const candidates: string[] = [
        getDisplayName(flip),
        flip.tag ?? '',
        flip.startingKey?.reforge ?? '',
        flip.startingKey?.tier?.toString() ?? '',
        flip.endingKey?.reforge ?? '',
        flip.endingKey?.tier?.toString() ?? ''
    ]

    flip.ingredients?.forEach(ingredient => {
        if (ingredient.itemId) {
            candidates.push(ingredient.itemId)
        }
        if (ingredient.attributeName) {
            candidates.push(ingredient.attributeName)
        }
    })

    flip.startingKey?.enchants?.forEach(enchant => {
        if (enchant.type) {
            candidates.push(enchant.type)
        }
    })

    flip.endingKey?.enchants?.forEach(enchant => {
        if (enchant.type) {
            candidates.push(enchant.type)
        }
    })

    flip.startingKey?.modifiers?.forEach(modifier => {
        if (modifier.key) {
            candidates.push(modifier.key)
        }
    })

    flip.endingKey?.modifiers?.forEach(modifier => {
        if (modifier.key) {
            candidates.push(modifier.key)
        }
    })

    return profitMatch && candidates.some(candidate => convertTagToName(candidate).toLowerCase().includes(search))
}

function censoredItemGenerator(flip: AttributeFlip): AttributeFlip {
    return {
        ...flip,
        itemName: 'Unlock Starter Premium to view',
        tag: 'BARRIER',
        target: flip.target + 123456,
        auctionPrice: flip.auctionPrice + 65432,
        estimatedCraftingCost: flip.estimatedCraftingCost + 11111
    }
}

function getFlipLink(flip: AttributeFlip): string | null {
    if (flip.auctionToBuy) {
        return `https://sky.coflnet.com/auction/${flip.auctionToBuy}`
    }
    if (flip.tag) {
        return `https://sky.coflnet.com/item/${flip.tag}`
    }
    return null
}

function onFlipClick(flip: AttributeFlip): void {
    const link = getFlipLink(flip)
    if (link) {
        window.open(link, '_blank', 'noopener')
    }
}

export function AttributeFlips() {
    const queryClient = useQueryClient()
    const { data: response } = useSuspenseQuery<AttributeFlipApiResponse>({
        queryKey: ['attributeFlips', 'default'],
        queryFn: () => fetchAttributeFlips()
    })

    const handleAfterLogin = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['attributeFlips', 'default'] })
    }, [queryClient])

    if (response.status !== 200 || !Array.isArray(response.data)) {
        const messageFromApi = typeof response.data === 'string'
            ? response.data
            : (response.data && typeof response.data === 'object' && 'message' in response.data ? String(response.data.message) : undefined)

        return (
            <div className={styles.alertWrapper}>
                <Alert variant="info">
                    <h3 className={styles.premiumTitle}>Premium access required</h3>
                    <p>
                        Attribute flips are high-tier crafting plays where you stack enchants, attribute shards, reforges, and other upgrades to push an item&apos;s resale value.
                    </p>
                    <p>
                        Because the workflow is so intricate and data-heavy, we keep this toolbox exclusively for members with premium access.
                    </p>
                    {messageFromApi ? <p className={styles.apiMessage}>{messageFromApi}</p> : null}
                </Alert>
                <div className={styles.ctaRow}>
                    <Link href="/premium" className="disableLinkStyle" rel="nofollow">
                        <Button variant="primary">See premium plans</Button>
                    </Link>
                    <GoogleSignIn onAfterLogin={handleAfterLogin} />
                </div>
            </div>
        )
    }

    const flips = response.data

    return (
        <div className={styles.attributeFlips}>
            <div>
                <p>
                    Attribute flips let you upgrade items with enchants, attribute shards, hot potato books, or other modifiers and sell the finished item for a profit. This list compares the base auction cost, upgrade materials, and projected sale price so you can focus on the most profitable upgrades.
                </p>
                <details>
                    <summary>How to perform attribute flips</summary>
                    <ol>
                        <li>Pick a flip with positive profit and healthy volume.</li>
                        <li>Buy the base item from the Auction House using the suggested auction link.</li>
                        <li>Purchase the listed upgrade materials or craft the required shards.</li>
                        <li>Apply the upgrades via the Hex, anvil, attribute fusion or relevant stations.</li>
                        <li>Create a BIN auction with the target price and monitor the market.</li>
                    </ol>
                </details>
                <details>
                    <summary>Tips for safer flipping</summary>
                    <ul>
                        <li>Check the recent sale history of the finished item before investing.</li>
                        <li>Consider setting buy orders for expensive materials to improve margins.</li>
                        <li>Adjust the sale price slightly below the target if the market is moving.</li>
                    </ul>
                </details>
            </div>
            <GenericFlipList
                items={flips}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterAttributeFlip}
                getItemKeyAction={flip => `${flip.auctionToBuy ?? flip.tag ?? 'flip'}-${flip.foundAt}`}
                censoredItemGenerator={censoredItemGenerator}
                onFlipClick={onFlipClick}
                getFlipLink={getFlipLink}
                showColumns={true}
                premiumMessage="The top 3 attribute flips can only be seen with Starter premium or better"
            />
        </div>
    )
}

export default AttributeFlips
