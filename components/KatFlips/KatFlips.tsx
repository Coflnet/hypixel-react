import React, { ChangeEvent, useEffect, useState } from 'react'
import { Form, ListGroup } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { convertTagToName, getStyleForTier, numberWithThousandsSeperators } from '../../utils/Formatter'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import styles from './KatFlips.module.css'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import Link from 'next/link'

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
    let [orderBy, setOrderBy] = useState<SortOption>(SORT_OPTIONS[0])
    let [hasPremium, setHasPremium] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [showTechSavvyMessage, setShowTechSavvyMessage] = useState(false)
    let router = useRouter()

    useEffect(() => {
        // reset the blur observer, when something changed
        setTimeout(() => {
            setBlurObserver()
        }, 100)
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
        let googleId = localStorage.getItem('googleId')
        return api.hasPremium(googleId!).then(hasPremiumUntil => {
            let hasPremium = false
            if (hasPremiumUntil !== undefined && hasPremiumUntil.getTime() > new Date().getTime()) {
                hasPremium = true
            }
            setHasPremium(hasPremium)
        })
    }

    function onNameFilterChange(e: any) {
        setNameFilter(e.target.value)
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
        filter: 'blur(5px)'
    }

    function onFlipClick(e, flip: KatFlip) {
        if (e.defaultPrevented) {
            return
        }
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

    function onCostClick(e, flip: KatFlip) {
        e.preventDefault()
        router.push({
            pathname: 'auction/' + flip.originAuctionUUID
        })
    }

    function onProfitClick(e, flip: KatFlip) {
        e.preventDefault()
        router.push({
            pathname: 'auction/' + flip.referenceAuctionUUID
        })
    }

    function getListElement(flip: KatFlip, blur: boolean) {
        if (nameFilter && flip.coreData.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
            return <span />
        }
        return (
            <ListGroup.Item
                action={!blur}
                onClick={e => {
                    onFlipClick(e, flip)
                }}
            >
                {blur ? (
                    <p style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', fontSize: 'large', fontWeight: 'bold', textAlign: 'center' }}>
                        The top 3 flips can only be seen with premium
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
                <div className={`${blur ? 'blur' : null}`} style={blur ? blurStyle : {}}>
                    <h4>{getFlipHeader(flip)}</h4>
                    <p>
                        <span
                            className={styles.label}
                            onClick={e => {
                                onCostClick(e, flip)
                            }}
                        >
                            Cost:
                        </span>{' '}
                        <Link href={'auction/' + flip.originAuctionUUID}>{`${numberWithThousandsSeperators(Math.round(flip.coreData.cost))} Coins`}</Link>
                    </p>
                    <p>
                        <span className={styles.label}>Material-Cost:</span> {numberWithThousandsSeperators(Math.round(flip.materialCost))} Coins
                    </p>
                    <p>
                        <span className={styles.label}>Median:</span> {numberWithThousandsSeperators(Math.round(flip.median))} Coins
                    </p>
                    {flip.coreData.material ? (
                        <span>
                            <p>
                                <span className={styles.label}>Material:</span> {`${flip.coreData.amount}x ${convertTagToName(flip.coreData.material)}`}
                            </p>
                            <p>
                                <span className={styles.label}>Material-Cost:</span> {numberWithThousandsSeperators(Math.round(flip.materialCost))} Coins
                            </p>
                        </span>
                    ) : null}
                    <p>
                        <span
                            className={styles.label}
                            onClick={e => {
                                onProfitClick(e, flip)
                            }}
                        >
                            Profit:
                        </span>{' '}
                        <Link href={'auction/' + flip.referenceAuctionUUID}>{`${numberWithThousandsSeperators(Math.round(flip.profit))} Coins`}</Link>
                    </p>
                    <p>
                        <span className={styles.label}>Volume:</span> {numberWithThousandsSeperators(Math.round(flip.volume))}
                    </p>
                    <p>
                        <span className={styles.label}>Upgrade Cost:</span> {numberWithThousandsSeperators(Math.round(flip.upgradeCost))} Coins
                    </p>
                    <p>
                        <span className={styles.label}>Target Rarity:</span> <span style={getStyleForTier(flip.targetRarity)}>{flip.targetRarity}</span>
                    </p>
                    <p>
                        <span className={styles.label}>Time:</span> {flip.coreData.hours} Hours
                    </p>
                </div>
            </ListGroup.Item>
        )
    }

    function getFlipHeader(flip) {
        return (
            <span style={getStyleForTier(flip.coreData.item.tier)}>
                <img crossOrigin="anonymous" src={flip.coreData.item.iconUrl} height="32" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                {convertTagToName(flip.coreData.item.name) || convertTagToName(flip.coreData.item.tag)}
            </span>
        )
    }

    let orderedFlips = props.flips
    if (orderBy) {
        let sortOption = SORT_OPTIONS.find(option => option.value === orderBy.value)
        orderedFlips = sortOption?.sortFunction(props.flips)
    }

    let shown = 0
    let list = orderedFlips.map((flip, i) => {
        if (nameFilter && flip.coreData.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
            return null
        }
        shown++
        return !hasPremium && shown <= 3 ? (
            <div className={`${styles.flipCard} ${styles.preventSelect}`} key={flip.originAuctionUUID}>
                {getListElement(flip, true)}
            </div>
        ) : (
            <div className={styles.flipCard} key={flip.originAuctionUUID}>
                {getListElement(flip, false)}
            </div>
        )
    })

    return (
        <div className={styles.catFlips}>
            <div>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
                {!isLoggedIn ? <hr /> : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Form.Control style={{ width: '49%' }} placeholder="Item name..." onChange={onNameFilterChange} />
                <Form.Control style={{ width: '49%' }} defaultValue={orderBy.value} as="select" onChange={updateOrderBy}>
                    {SORT_OPTIONS.map(option => (
                        <option value={option.value}>{option.label}</option>
                    ))}
                </Form.Control>
            </div>
            <hr />
            <p>Click on a craft for further details</p>
            <div className={styles.craftsList}>
                <ListGroup className={styles.list}>{list}</ListGroup>
            </div>
        </div>
    )
}
