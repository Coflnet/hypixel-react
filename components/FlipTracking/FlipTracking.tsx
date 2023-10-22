'use client'
import DangerousIcon from '@mui/icons-material/Dangerous'
import Image from 'next/image'
import { ChangeEvent, useEffect, useState } from 'react'
import { Form, ListGroup } from 'react-bootstrap'
import { Item, Menu, useContextMenu } from 'react-contexify'
import { useForceUpdate, useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { getSettingsObject, IGNORE_FLIP_TRACKING_PROFIT, setSetting } from '../../utils/SettingsUtils'
import { isClientSideRendering } from '../../utils/SSRUtils'
import styles from './FlipTracking.module.css'
import DatePicker from 'react-datepicker'
import api from '../../api/ApiHelper'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { PREMIUM_RANK, hasHighEnoughPremium } from '../../utils/PremiumTypeUtils'
import { getLoadingElement } from '../../utils/LoadingUtils'
import Link from 'next/link'
import { FlipTrackingTotalProfitCalculation } from './FlipTrackingTotalProfitCalculation'
import { FlipTrackingListItem } from './FlipTrackingListItem'

interface Props {
    totalProfit?: number
    trackedFlips?: FlipTrackingFlip[]
    highlightedFlipUid?: string
    playerUUID: string
}

interface SortOption {
    label: string
    value: string
    sortFunction(flips: FlipTrackingFlip[])
}

const SORT_OPTIONS: SortOption[] = [
    {
        label: 'Time',
        value: 'timeAsc',
        sortFunction: flips => flips.sort((a, b) => b.sellTime.getTime() - a.sellTime.getTime())
    },
    {
        label: 'Profit ⇩',
        value: 'profitDec',
        sortFunction: flips => flips.sort((a, b) => b.profit - a.profit)
    },
    {
        label: 'Profit ⇧',
        value: 'profitAsc',
        sortFunction: flips => flips.sort((a, b) => a.profit - b.profit)
    },
    {
        label: 'Sell price',
        value: 'sellPrice',
        sortFunction: flips => flips.sort((a, b) => b.soldFor - a.soldFor)
    },
    {
        label: 'Profit%',
        value: 'profitPercent',
        sortFunction: flips => flips.sort((a, b) => b.profit / b.pricePaid - a.profit / a.pricePaid)
    }
]

const TRACKED_FLIP_CONTEXT_MENU_ID = 'tracked-flip-context-menu'

export function FlipTracking(props: Props) {
    let [trackedFlips, setTrackedFlips] = useState<FlipTrackingFlip[]>(props.trackedFlips || [])
    let [orderBy, setOrderBy] = useState<SortOption>(SORT_OPTIONS[0])
    let [ignoreProfitMap, setIgnoreProfitMap] = useState(getSettingsObject(IGNORE_FLIP_TRACKING_PROFIT, {}))
    let [rangeStartDate, setRangeStartDate] = useState(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))
    let [rangeEndDate, setRangeEndDate] = useState(new Date())
    let [hasPremium, setHasPremium] = useState(false)
    let [isLoading, setIsLoading] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [wasManualLoginClick, setWasManualLoginClick] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    let forceUpdate = useForceUpdate()

    const { show } = useContextMenu({
        id: TRACKED_FLIP_CONTEXT_MENU_ID
    })

    useEffect(() => {
        if (props.highlightedFlipUid && isClientSideRendering()) {
            let element = document.getElementById(props.highlightedFlipUid) as HTMLElement
            window.scrollTo({
                top: element.offsetTop
            })
        }
        refreshIgnoredFlipsInLocalstorage()
    }, [])

    /**
     * Checks if flips are marked to be ignored for this player, but aren't there anymore, they are removed from the localStorage
     */
    function refreshIgnoredFlipsInLocalstorage() {
        let newIgnoreMap = {}
        trackedFlips.forEach(flip => {
            if (ignoreProfitMap[flip.uId.toString(16)]) {
                newIgnoreMap[flip.uId.toString(16)] = true
            }
        })
        setSetting(IGNORE_FLIP_TRACKING_PROFIT, JSON.stringify(newIgnoreMap))
        setIgnoreProfitMap(newIgnoreMap)
    }

    function updateOrderBy(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        let sortOption = SORT_OPTIONS.find(option => option.value === value)
        if (sortOption) {
            setOrderBy(sortOption)
        }
    }

    function handleContextMenuForTrackedFlip(event) {
        event.preventDefault()
        show({ event: event, props: { uid: event.currentTarget.id } })
    }

    function splitIntoBatches(startDate: Date, endDate: Date): [Date, Date][] {
        const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000
        const batches: [Date, Date][] = []

        let currentDate = new Date(endDate)

        while (currentDate.getTime() > startDate.getTime()) {
            const batchStartDate = new Date(currentDate.getTime() - sevenDaysInMilliseconds)

            if (batchStartDate.getTime() < startDate.getTime()) {
                batches.push([startDate, currentDate])
            } else {
                batches.push([batchStartDate, currentDate])
            }

            currentDate = new Date(batchStartDate.getTime() - 1) // Move to the previous day
        }

        return batches
    }

    function getDaysDifference(date1: Date, date2: Date): number {
        date1.setHours(0, 0, 0, 0)
        date2.setHours(0, 0, 0, 0)
        const timeDifference = Math.abs(date1.getTime() - date2.getTime())
        const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24))

        return daysDifference
    }

    function loadFlipsForTimespan(from: Date, to: Date) {
        let batches = splitIntoBatches(from, to)
        let offset = 0
        let promises: Promise<FlipTrackingResponse>[] = []
        batches.forEach(batch => {
            let diff = getDaysDifference(batch[0], batch[1])
            let promise = api.getTrackedFlipsForPlayer(props.playerUUID, diff, offset)
            promises.push(promise)
            offset += diff
        })

        setTrackedFlips([])
        setIsLoading(true)
        let newFlips: FlipTrackingFlip[] = []
        Promise.all(promises).then(results => {
            results.forEach(result => {
                newFlips.push(...result.flips)
            })
            setIsLoading(false)
            setTrackedFlips(newFlips)
        })
    }

    function onAfterLogin() {
        setIsLoggedIn(true)
        api.refreshLoadPremiumProducts(products => {
            let hasEnoughPremium = hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM)
            setHasPremium(hasEnoughPremium)

            if (wasManualLoginClick && hasEnoughPremium) {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        })
    }

    let orderedFlips = trackedFlips
    if (orderBy) {
        let sortOption = SORT_OPTIONS.find(option => option.value === orderBy.value)
        orderedFlips = sortOption?.sortFunction(trackedFlips)
    }

    let currentItemContextMenuElement = (
        <div>
            <Menu id={TRACKED_FLIP_CONTEXT_MENU_ID} theme={'dark'}>
                <Item
                    onClick={params => {
                        ignoreProfitMap[params.props.uid] = true
                        setSetting(IGNORE_FLIP_TRACKING_PROFIT, JSON.stringify(ignoreProfitMap))
                        setIgnoreProfitMap(ignoreProfitMap)
                        forceUpdate()
                    }}
                >
                    <DangerousIcon style={{ marginRight: '5px' }} />
                    Ignore flip for profit calculation
                </Item>
            </Menu>
        </div>
    )

    let list = orderedFlips.map((trackedFlip, i) => {
        return (
            <FlipTrackingListItem
                key={trackedFlip.uId + ' - ' + ignoreProfitMap[trackedFlip.uId.toString(16)]}
                trackedFlip={trackedFlip}
                isHighlighted={props.highlightedFlipUid === trackedFlip.uId.toString(16)}
                onContextMenu={handleContextMenuForTrackedFlip}
                ignoreProfit={ignoreProfitMap[trackedFlip.uId.toString(16)] || false}
                onRemoveFlipFromIgnoreMap={() => {
                    let newIgnoreMap = { ...ignoreProfitMap }
                    delete newIgnoreMap[trackedFlip.uId.toString(16)]
                    setSetting(IGNORE_FLIP_TRACKING_PROFIT, JSON.stringify(newIgnoreMap))
                    setIgnoreProfitMap(newIgnoreMap)
                }}
            />
        )
    })

    return (
        <div>
            <FlipTrackingTotalProfitCalculation flips={trackedFlips} ignoreProfitMap={ignoreProfitMap} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <Form.Select style={{ width: 'auto', marginTop: '20px' }} defaultValue={orderBy.value} onChange={updateOrderBy}>
                    {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
                {hasPremium ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ marginRight: 15 }}>From: </label>
                        <div style={{ paddingRight: 15 }}>
                            <DatePicker
                                onChange={e => {
                                    setRangeStartDate(e)
                                    loadFlipsForTimespan(e, rangeEndDate)
                                }}
                                className={'form-control'}
                                minDate={new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30 * 2)}
                                maxDate={new Date()}
                                selected={rangeStartDate}
                            />
                        </div>
                        <label style={{ marginRight: 15 }}>To: </label>
                        <DatePicker
                            className={'form-control'}
                            onChange={e => {
                                setRangeEndDate(e)
                                loadFlipsForTimespan(rangeStartDate, e)
                            }}
                            minDate={new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30 * 2)}
                            maxDate={new Date()}
                            selected={rangeEndDate}
                        />
                    </div>
                ) : null}
            </div>
            {isLoading ? (
                getLoadingElement()
            ) : (
                <div>
                    {trackedFlips.length === 0 ? (
                        <div className={styles.noAuctionFound}>
                            <Image src="/Barrier.png" width="24" height="24" alt="not found icon" style={{ float: 'left', marginRight: '5px' }} />{' '}
                            <p>We couldn't find any flips.</p>
                        </div>
                    ) : (
                        <ListGroup className={styles.list}>{list}</ListGroup>
                    )}
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={wasAlreadyLoggedIn || isLoggedIn ? { visibility: 'collapse', height: 0 } : {}}>
                    <p>
                        You can get flips further in the past with{' '}
                        <Link href={'/premium'} style={{ marginBottom: '15px' }}>
                            Premium
                        </Link>
                        .
                    </p>
                    <GoogleSignIn
                        onAfterLogin={onAfterLogin}
                        onManualLoginClick={() => {
                            setWasManualLoginClick(true)
                        }}
                    />
                </div>
            </div>
            {currentItemContextMenuElement}
        </div>
    )
}
