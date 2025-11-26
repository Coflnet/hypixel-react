'use client'
import Image from 'next/image'
import { Badge } from 'react-bootstrap'
import NumberElement from '../../Number/Number'
import api from '../../../api/ApiHelper'
import { ReverseNpcFlip, Cost } from '../../../api/_generated/skyApi.schemas'
import { convertTagToName } from '../../../utils/Formatter'
import styles from './NpcFlipDetails.module.css'

interface Props {
    flip: ReverseNpcFlip
}

function formatMargin(margin?: number | null): string {
    if (margin === null || margin === undefined || Number.isNaN(margin)) {
        return 'unknown'
    }
    const normalized = margin > 1 ? margin : margin * 100
    const fixedDigits = normalized >= 100 ? 0 : normalized >= 10 ? 1 : 2
    return `${normalized.toFixed(fixedDigits)}%`
}

function getNpcWikiUrl(npcName: string): string {
    // Convert NPC name to wiki URL format (replace spaces with underscores)
    const formattedName = npcName.replace(/\s+/g, '_')
    return `https://wiki.hypixel.net/${formattedName}`
}

function isCoins(cost: Cost): boolean {
    return !cost.itemTag || cost.itemTag === 'SKYBLOCK_COIN' || cost.itemTag === 'COIN'
}

export function NpcFlipDetails(props: Props) {
    const { flip } = props

    function onItemClick(tag: string) {
        window.open(`https://sky.coflnet.com/item/${tag}`, '_blank')
    }

    function onNpcClick() {
        if (flip.npcName) {
            window.open(getNpcWikiUrl(flip.npcName), '_blank')
        }
    }

    const totalCost = flip.costs?.reduce((sum, cost) => sum + (cost.price || 0), 0) || flip.npcBuyPrice || 0

    return (
        <div className={styles.detailsContainer}>
            {flip.npcName && (
                <div className={styles.section}>
                    <h4>NPC Information</h4>
                    <div className={styles.npcInfo} onClick={onNpcClick}>
                        <span className={styles.npcName}>{flip.npcName}</span>
                        <Badge bg="info" style={{ marginLeft: '8px' }}>
                            Open Wiki →
                        </Badge>
                    </div>
                </div>
            )}

            <hr />

            <div className={styles.section}>
                <h4>Cost Breakdown</h4>
                <p className={styles.totalCost}>
                    Total Purchase Cost: <NumberElement number={Math.round(totalCost)} /> Coins
                </p>
                {flip.costs && flip.costs.length > 0 && (
                    <div className={styles.costsList}>
                        {flip.costs.map((cost, index) => {
                            const itemName = cost.itemName || convertTagToName(cost.itemTag || '')
                            const coinItem = isCoins(cost)

                            return (
                                <div
                                    key={index}
                                    className={`${styles.costItem} ${!coinItem ? styles.clickable : ''}`}
                                    onClick={() => !coinItem && cost.itemTag && onItemClick(cost.itemTag)}
                                >
                                    {!coinItem && (
                                        <Image
                                            crossOrigin="anonymous"
                                            src={api.getItemImageUrl({ tag: cost.itemTag || '' }) || ''}
                                            height="24"
                                            width="24"
                                            alt=""
                                            style={{ marginRight: '8px' }}
                                            loading="lazy"
                                        />
                                    )}
                                    <span className={styles.costAmount}>{cost.amount}x</span>
                                    <span className={styles.costName}>{itemName}</span>
                                    <Badge style={{ marginLeft: 'auto' }} bg="secondary">
                                        <NumberElement number={Math.round(cost.price)} /> Coins
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <hr />

            <div className={styles.section}>
                <h4>Profit Summary</h4>
                <div className={styles.profitGrid}>
                    <div className={styles.profitRow}>
                        <span>Sell Price:</span>
                        <span>
                            <NumberElement number={Math.round(flip.sellPrice || 0)} /> Coins
                        </span>
                    </div>
                    <div className={styles.profitRow}>
                        <span>Purchase Cost:</span>
                        <span>
                            <NumberElement number={Math.round(totalCost)} /> Coins
                        </span>
                    </div>
                    <div className={`${styles.profitRow} ${styles.profitHighlight}`}>
                        <span>Profit:</span>
                        <span style={{ color: (flip.profit || 0) > 0 ? '#55ff55' : '#ff5555' }}>
                            <NumberElement number={Math.round(flip.profit || 0)} /> Coins
                        </span>
                    </div>
                    <div className={styles.profitRow}>
                        <span>Profit Margin:</span>
                        <span>{formatMargin(flip.profitMargin)}</span>
                    </div>
                    <div className={styles.profitRow}>
                        <span>Daily Volume:</span>
                        <span>{(flip.volume || 0) > 0 ? <NumberElement number={Math.round(flip.volume || 0)} /> : 'unknown'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
