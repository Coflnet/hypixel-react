'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Badge, Form, ListGroup } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import Number from '../Number/Number'
import { SpreadFlip } from '../../api/_generated/skyApi.schemas'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getApiFlipBazaarSpread, getGetApiFlipBazaarSpreadQueryKey } from '../../api/_generated/skyApi'
import styles from './BazaarFlips.module.css'

interface SortOption {
    label: string
    value: string
    sortFunction(flips: SpreadFlip[])
}
const SORT_OPTIONS: SortOption[] = [
    {
        label: 'Profit/Hour',
        value: 'profitPerHour',
        sortFunction: crafts => crafts.sort((a, b) => b.flip!.profitPerHour - a.flip!.profitPerHour)
    },
    {
        label: 'Time ⇧',
        value: 'timeAsc',
        sortFunction: crafts => crafts.sort((a, b) => b.flip!.profitPerHour - a.flip!.profitPerHour)
    },
    {
        label: 'Time ⇩',
        value: 'timeDesc',
        sortFunction: crafts => crafts.sort((a, b) => a.flip!.profitPerHour - b.flip!.profitPerHour)
    }
]

let observer: MutationObserver

export function BazaarFlips() {
    let [nameFilter, setNameFilter] = useState<string | null>()
    let [minimumProfit, setMinimumProfit] = useState<number>(0)
    let [orderBy, setOrderBy] = useState<SortOption>(SORT_OPTIONS[0])
    let [hasPremium, setHasPremium] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [showTechSavvyMessage, setShowTechSavvyMessage] = useState(false)

    const { data: { data: flips } = { data: [] } } = useSuspenseQuery({
        queryKey: [getGetApiFlipBazaarSpreadQueryKey()],
        queryFn: () => getApiFlipBazaarSpread(),
    })
    console.log('BazaarFlips', flips)

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

    function getListElement(flip: SpreadFlip, blur: boolean) {
        return (
            <ListGroup.Item
                action={!blur}
                style={{ height: '100%', padding: '15px' }}
            >
                {blur ? (
                    <p style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', fontSize: 'large', fontWeight: 'bold', textAlign: 'center' }}>
                        The top 3 flips can only be seen with starter premium or better
                    </p>
                ) : null}
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
                        You seem like a tech savvy person, contribute to the project to get premium for free. :)
                    </p>
                ) : (
                    ''
                )}
                <div className={blur ? 'blur' : ''} style={blur ? blurStyle : {}}>
                    <h4>{getFlipHeader(flip)}</h4>
                    <p>
                        <span className={styles.label}>Purchase Cost:</span>{' '}
                        <Number number={Math.round(flip.flip?.buyPrice || 0)} /> Coins
                    </p>
                    <p>
                        <span className={styles.label}>Sell Price:</span> <Number number={Math.round(flip.flip?.sellPrice || 0)} />
                    </p>
                    <p>
                        <span className={styles.label}>Estimated Fees:</span>
                        <Number number={flip.flip?.estimatedFees || 0} /> Coins
                    </p>
                    {flip.flip?.medianBuyPrice &&
                        <p>
                            <span className={styles.label}>Median:</span> <Number number={Math.round(flip.flip?.medianBuyPrice || 0)} /> Coins
                        </p>}
                    <p>
                        <span className={styles.label}>Profit per Hour:</span>{' '}
                        <Number number={flip.flip?.profitPerHour || 0} /> Coins
                    </p>
                    <p>
                        <span className={styles.label}>Volume:</span>
                        <Number number={flip.flip?.volume || 0} />
                    </p>
                    {flip.isManipulated &&
                        <p style={{ display: 'flex', justifyContent: 'end' }}>
                            <Badge bg="info" className={styles.label}>Manipulated</Badge>
                        </p>
                    }
                </div>
            </ListGroup.Item>
        )
    }

    function getFlipHeader(flip: SpreadFlip) {
        return (
            <span>
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl({ tag: flip.flip?.itemTag || "" }) || ''}
                    height="32"
                    width="32"
                    alt=""
                    style={{ marginRight: '5px' }}
                    loading="lazy"
                />
                {flip.itemName}
            </span>
        )
    }

    let orderedFlips = [...flips]
    if (orderBy) {
        let sortOption = SORT_OPTIONS.find(option => option.value === orderBy.value)
        orderedFlips = sortOption?.sortFunction([...flips])
    }

    let shown = 0
    let list = orderedFlips
        .filter(flip => !((nameFilter && flip.itemName?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) || (flip.flip?.profitPerHour || 0) < minimumProfit))
        .map(flip => {
            if (!hasPremium && ++shown <= 3) {
                let censoredFlip: SpreadFlip = { ...flip }
                return (
                    <div className={`${styles.flipCard} ${styles.preventSelect}`} key={flip.itemName}>
                        {getListElement(censoredFlip, true)}
                    </div>
                )
            } else {
                return (
                    <div className={styles.flipCard} key={flip.itemName}>
                        {getListElement(flip, false)}
                    </div>
                )
            }
        })

    return (
        <div className={styles.bazaarFlips}>
            <div>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
                {!isLoggedIn ? <hr /> : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Form.Control className={styles.filterInput} placeholder="Item name..." onChange={onNameFilterChange} />
                <Form.Select className={styles.filterInput} defaultValue={orderBy.value} onChange={updateOrderBy}>
                    {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
                <Form.Control className={styles.filterInput} placeholder="Minimum Profit" onChange={onMinimumProfitChange} />
            </div>
            <hr />
            {hasPremium ? null : (
                <p>
                    Click <Link href="/linkvertise">here</Link> to get Starter Premium for free to see the top bazaar flips
                </p>
            )}
            <p>Click on a craft for further details</p>
            <div className={styles.craftsList}>
                <ListGroup className={styles.list}>{list}</ListGroup>
            </div>
        </div>
    )
}
