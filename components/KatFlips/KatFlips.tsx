import Image from 'next/image'
import Link from 'next/link'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Form, ListGroup } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { convertTagToName, getStyleForTier, numberWithThousandsSeparators } from '../../utils/Formatter'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import styles from './KatFlips.module.css'

interface Props {
    flips: KatFlip[]
}
interface SortOption {
    label: string
    value: string
    sortFunction(flips: KatFlip[])
}
const SORT_OPTIONS: SortOption[] = [
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: crafts => crafts.sort((a, b) => b.profit - a.profit)
    },
    {
        label: 'Time ⇧',
        value: 'timeAsc',
        sortFunction: crafts => crafts.sort((a, b) => b.coreData.hours - a.coreData.hours)
    },
    {
        label: 'Time ⇩',
        value: 'timeDesc',
        sortFunction: crafts => crafts.sort((a, b) => a.coreData.hours - b.coreData.hours)
    },
    {
        label: 'Profit/Time',
        value: 'profitPerTime',
        sortFunction: crafts => crafts.sort((a, b) => b.profit / b.coreData.hours - a.profit / a.coreData.hours)
    }
]

let observer: MutationObserver

export function KatFlips(props: Props) {
    let [nameFilter, setNameFilter] = useState<string | null>()
    let [minimumProfit, setMinimumProfit] = useState<number>(0)
    let [orderBy, setOrderBy] = useState<SortOption>(SORT_OPTIONS[0])
    let [hasPremium, setHasPremium] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [showTechSavvyMessage, setShowTechSavvyMessage] = useState(false)

    useEffect(() => {
        // reset the blur observer, when something changed
        setTimeout(setBlurObserver, 100)
    })

    function setBlurObserver() {
        if (observer) {
            observer.disconnect()
        }
        observer = new MutationObserver(function () {
            setShowTechSavvyMessage(true)
        })

        var targets = document.getElementsByClassName('blur')
        for (var i = 0; i < targets.length; i++) {
            var config = {
                attributes: true,
                childList: true,
                characterData: true,
                attributeFilter: ['style']
            }
            observer.observe(targets[i], config)
        }
    }

    function onAfterLogin() {
        setIsLoggedIn(true)
        return api.refreshLoadPremiumProducts(products => {
            setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
        })
    }

    function onNameFilterChange(e: any) {
        setNameFilter(e.target.value)
    }
    function onMinimumProfitChange(e: any) {
        setMinimumProfit(e.target.value)
    }
    function updateOrderBy(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        let sortOption = SORT_OPTIONS.find(option => option.value === value)
        if (sortOption) {
            setOrderBy(sortOption)
        }
    }

    let blurStyle: React.CSSProperties = {
        WebkitFilter: 'blur(5px)',
        msFilter: 'blur(5px)',
        filter: 'blur(5px)',
        pointerEvents: 'none'
    }

    function onFlipClick(e, flip: KatFlip) {
        if (e.defaultPrevented || !flip.originAuctionUUID) {
            return
        }
        window.navigator.clipboard.writeText('/viewauction ' + flip.originAuctionUUID)

        toast.success(
            <p>
                Copied the origin auction UUID <br />
                <i>{flip.originAuctionUUID}</i>
            </p>,
            {
                autoClose: 1500,
                pauseOnFocusLoss: false
            }
        )
    }

    function getListElement(flip: KatFlip, blur: boolean) {
        if ((nameFilter && flip.coreData.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1)&&!blur) {
            return <span />
        }
        return (
            <ListGroup.Item
                action={!blur}
                onClick={e => {
                    onFlipClick(e, flip)
                }}
                style={{ height: '100%', padding: '15px' }}
            >
                {blur ? (
                    <p style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', fontSize: 'large', fontWeight: 'bold', textAlign: 'center' }}>
                        The top 3 flips can only be seen with starter premium or better
                    </p>
                ) : (
                    ''
                )}
                {showTechSavvyMessage && blur ? (
                    <p
                        style={{
                            position: 'absolute',
                            top: '25%',
                            left: '25%',
                            width: '50%',
                            fontSize: 'large',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: 'gray'
                        }}
                    >
                        You seem like a tech savvy person, join our development team to get premium for free. :)
                    </p>
                ) : (
                    ''
                )}
                <div className={blur ? 'blur' : ''} style={blur ? blurStyle : {}}>
                    <h4>{getFlipHeader(flip)}</h4>
                    <p>
                        <span className={styles.label}>Purchase Cost:</span>{' '}
                        <Link href={'auction/' + flip.originAuctionUUID}>{`${numberWithThousandsSeparators(Math.round(flip.purchaseCost))} Coins`}</Link>
                    </p>
                    <p>
                        <span className={styles.label}>Upgrade Cost:</span> {numberWithThousandsSeparators(Math.round(flip.upgradeCost))} Coins
                    </p>
                    {flip.coreData.material ? (
                        <span>
                            <p>
                                <span className={styles.label}>Material:</span> {`${flip.coreData.amount}x ${convertTagToName(flip.coreData.material)}`}
                            </p>
                            <p>
                                <span className={styles.label}>Material Cost:</span> {numberWithThousandsSeparators(Math.round(flip.materialCost))} Coins
                            </p>
                        </span>
                    ) : null}
                    <p>
                        <span className={styles.label}>Median:</span> {numberWithThousandsSeparators(Math.round(flip.median))} Coins
                    </p>
                    <p>
                        <span className={styles.label}>Profit:</span>{' '}
                        <Link href={'auction/' + flip.referenceAuctionUUID}>{`${numberWithThousandsSeparators(Math.round(flip.profit))} Coins`}</Link>
                    </p>
                    <hr />
                    <p>
                        <span className={styles.label}>Volume:</span> {numberWithThousandsSeparators(Math.round(flip.volume))}
                    </p>
                    <p>
                        <span className={styles.label}>Target Rarity:</span> <span style={getStyleForTier(flip.targetRarity)}>{flip.targetRarity}</span>
                    </p>
                    <p>
                        <span className={styles.label}>Time:</span> {flip.coreData.hours} Hours
                    </p>
                </div>
            </ListGroup.Item>
        );
    }

    function getFlipHeader(flip: KatFlip) {
        return (
            <span style={getStyleForTier(flip.coreData.item.tier)}>
                <Image crossOrigin="anonymous" src={flip.coreData.item.iconUrl} height="32" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                {convertTagToName(flip.originAuctionName) || convertTagToName(flip.coreData.item.tag)}
            </span>
        )
    }

    let orderedFlips = props.flips
    if (orderBy) {
        let sortOption = SORT_OPTIONS.find(option => option.value === orderBy.value)
        orderedFlips = sortOption?.sortFunction(props.flips)
    }

    let shown = 0
    let list = orderedFlips.filter(flip => !((nameFilter && flip.coreData.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) || flip.profit < minimumProfit)).map(flip => {
        
        if (!hasPremium && ++shown <= 3) {
            let censoredFlip : KatFlip = { ...flip }
            censoredFlip.coreData = {
                amount: -1,
                hours: 69,
                item: {
                    tag: '',
                    name: 'You cheated the blur ☺',
                    tier: 'LEGENDARY',
                    iconUrl: 'https://sky.coflnet.com/static/icon/BARRIER'
                },
                material: '1 CoflCoin'
            }
            censoredFlip.cost = 12345
            censoredFlip.materialCost = 696969
            censoredFlip.median = 424242
            censoredFlip.originAuctionUUID = ''
            censoredFlip.profit = -100000
            censoredFlip.purchaseCost = 1
            censoredFlip.referenceAuctionUUID = ''
            censoredFlip.volume = -1
            censoredFlip.upgradeCost = 0
            censoredFlip.originAuctionName = 'You cheated the blur ☺'
            return (
                <div className={`${styles.flipCard} ${styles.preventSelect}`} key={flip.originAuctionUUID}>
                    {getListElement(censoredFlip, true)}
                </div>
            )
        } else {
            return (
                <div className={styles.flipCard} key={flip.originAuctionUUID}>
                    {getListElement(flip, false)}
                </div>
            )
        }
    })

    return (
        <div className={styles.catFlips}>
            <div>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
                {!isLoggedIn ? <hr /> : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Form.Control className={styles.filterInput} placeholder="Item name..." onChange={onNameFilterChange} />
                <Form.Control className={styles.filterInput} defaultValue={orderBy.value} as="select" onChange={updateOrderBy}>
                    {SORT_OPTIONS.map(option => (
                        <option value={option.value}>{option.label}</option>
                    ))}
                </Form.Control>
                <Form.Control className={styles.filterInput} placeholder='Minimum Profit' onChange={onMinimumProfitChange} />
                

            </div>
            <hr />
            <p>Click on a craft for further details</p>
            <div className={styles.craftsList}>
                <ListGroup className={styles.list}>{list}</ListGroup>
            </div>
        </div>
    )
}
