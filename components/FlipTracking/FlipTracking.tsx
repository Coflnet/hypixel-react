'use client'
import DangerousIcon from '@mui/icons-material/Dangerous'
import Image from 'next/image'
import { ChangeEvent, useEffect, useState } from 'react'
import { Form, ListGroup } from 'react-bootstrap'
import { Item, Menu, useContextMenu } from 'react-contexify'
import { useForceUpdate, useQueryParamState, useWasAlreadyLoggedIn } from '../../utils/Hooks'
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
import { NumberRangeFilterElement } from '../FilterElement/FilterElements/NumberRangeFilterElement'

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

interface FilterOption {
    label: string
    value: string
    filterFunction(flips: FlipTrackingFlip[])
}

enum FlipTrackingFlags {
    None = 'None',
    DifferentBuyer = 'DifferentBuyer',
    ViaTrade = 'ViaTrade',
    MultiItemTrade = 'MultiItemTrade'
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

const FILTER_OPTIONS: FilterOption[] = [
    { label: '-', value: 'all', filterFunction: flips => flips },
    { label: 'Only Trades', value: 'only-trades', filterFunction: flips => flips.filter(flip => flip.flags.has(FlipTrackingFlags.ViaTrade)) },
    {
        label: 'Only Same Buyer',
        value: 'same-buyer',
        filterFunction: flips => flips.filter(flip => !flip.flags.has(FlipTrackingFlags.DifferentBuyer))
    }
]

const TRACKED_FLIP_CONTEXT_MENU_ID = 'tracked-flip-context-menu'

export function FlipTracking(props: Props) {
    let [trackedFlips, setTrackedFlips] = useState<FlipTrackingFlip[]>(props.trackedFlips || [])
    let [ignoreProfitMap, setIgnoreProfitMap] = useState(getSettingsObject(IGNORE_FLIP_TRACKING_PROFIT, {}))
    let [rangeStartDate, setRangeStartDate] = useState(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))
    let [rangeEndDate, setRangeEndDate] = useState(new Date())
    let [hasPremium, setHasPremium] = useState(false)
    let [isLoading, setIsLoading] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [wasManualLoginClick, setWasManualLoginClick] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    let forceUpdate = useForceUpdate()

    let [_orderBy, _setOrderBy] = useQueryParamState<string>('order', SORT_OPTIONS[0].value)
    let [_filterBy, _setFilterBy] = useQueryParamState<string>('filter', FILTER_OPTIONS[0].value)

    let orderBy = SORT_OPTIONS.find(o => o.value === _orderBy)!
    let filterBy = FILTER_OPTIONS.find(f => f.value === _filterBy)!
    let setOrderBy = (newValue: SortOption) => {
        _setOrderBy(newValue.value)
    }
    let setFilterBy = (newValue: FilterOption) => {
        _setFilterBy(newValue.value)
    }

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

    async function loadFlipsForTimespan(from: Date, to: Date) {
        setIsLoading(true)
        let newFlips = await api.getTrackedFlipsForPlayer(props.playerUUID, from, to)
        setTrackedFlips(newFlips.flips)
        setIsLoading(false)
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

    let flipsToDisplay = [...trackedFlips]
    if (orderBy) {
        let sortOption = SORT_OPTIONS.find(option => option.value === orderBy.value)
        flipsToDisplay = sortOption?.sortFunction(trackedFlips)
    }

    flipsToDisplay = filterBy.filterFunction(flipsToDisplay)

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

    let list = flipsToDisplay.map((trackedFlip, i) => {
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                    <div className={styles.filterContainer}>
                        <label htmlFor="flag-filter" style={{ width: '100px' }}>
                            Sort:
                        </label>
                        <Form.Select style={{ width: 'auto' }} defaultValue={orderBy.value} onChange={updateOrderBy}>
                            {SORT_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                    <div className={styles.filterContainer}>
                        <label htmlFor="flag-filter" style={{ width: '100px' }}>
                            Filter:
                        </label>
                        <Form.Select
                            id="flag-filter"
                            style={{ width: 'auto' }}
                            defaultValue={filterBy.value}
                            onChange={e => {
                                setFilterBy(FILTER_OPTIONS.find(option => option.value === e.target.value) || FILTER_OPTIONS[0])
                            }}
                        >
                            {FILTER_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                    <div className={styles.filterContainer}>
                        <label style={{ width: '100px' }}>Profit Range:</label>
                        <NumberRangeFilterElement defaultValue={0} onChange={() => {}} hideSlider />
                    </div>
                </div>
                {hasPremium ? (
                    <div className={styles.filterContainer}>
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
                ) : (
                    <span style={{ float: 'right', fontSize: 'small' }}>
                        Only auctions sold in the last 7 days are displayed here. <br /> You can see more with <Link href={'/premium'}>Premium</Link>
                    </span>
                )}
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
