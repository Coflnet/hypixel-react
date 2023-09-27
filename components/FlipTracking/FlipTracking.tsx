'use client'
import ArrowDownIcon from '@mui/icons-material/ArrowDownward'
import ArrowRightIcon from '@mui/icons-material/ArrowRightAlt'
import DangerousIcon from '@mui/icons-material/Dangerous'
import moment from 'moment'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChangeEvent, Suspense, useEffect, useState } from 'react'
import { Badge, Button, Card, Form, ListGroup, Table } from 'react-bootstrap'
import { Item, Menu, useContextMenu } from 'react-contexify'
import { getMinecraftColorCodedElement, getStyleForTier } from '../../utils/Formatter'
import { useForceUpdate } from '../../utils/Hooks'
import { getSettingsObject, IGNORE_FLIP_TRACKING_PROFIT, setSetting } from '../../utils/SettingsUtils'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { Number } from '../Number/Number'
import Tooltip from '../Tooltip/Tooltip'
import styles from './FlipTracking.module.css'
import FlipTrackingCopyButton from './FlipTrackingCopyButton'
import DatePicker from 'react-datepicker'
import api from '../../api/ApiHelper'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { PREMIUM_RANK, hasHighEnoughPremium } from '../../utils/PremiumTypeUtils'
import { getLoadingElement } from '../../utils/LoadingUtils'

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
    let [totalProfit, setTotalProfit] = useState(props.totalProfit || 0)
    let [trackedFlips, setTrackedFlips] = useState<FlipTrackingFlip[]>(props.trackedFlips || [])
    let [orderBy, setOrderBy] = useState<SortOption>(SORT_OPTIONS[0])
    let [ignoreProfitMap, setIgnoreProfitMap] = useState(getSettingsObject(IGNORE_FLIP_TRACKING_PROFIT, {}))
    let [rangeStartDate, setRangeStartDate] = useState(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))
    let [rangeEndDate, setRangeEndDate] = useState(new Date())
    let [hasPremium, setHasPremium] = useState(false)
    let [isLoading, setIsLoading] = useState(false)
    let router = useRouter()
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
        refreshForIgnoredFlip()
    }, [])

    /**
     * Checks all flips if they were marked to be ignored for the profit calculation and subtracts it if necessary
     * Also if flips are marked to be ignored for this player, but aren't there anymore, they are removed from the localStorage
     */
    function refreshForIgnoredFlip() {
        let totalProfit = props.totalProfit || 0
        let newIgnoreMap = {}
        trackedFlips.forEach(flip => {
            if (ignoreProfitMap[flip.uId.toString(16)]) {
                totalProfit -= flip.profit
                newIgnoreMap[flip.uId.toString(16)] = true
            }
        })
        setSetting(IGNORE_FLIP_TRACKING_PROFIT, JSON.stringify(newIgnoreMap))
        setTotalProfit(totalProfit)
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

    function loadAdditionalFlips() {}

    function handleContextMenuForTrackedFlip(event) {
        event.preventDefault()
        show({ event: event, props: { uid: event.currentTarget.id } })
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
                        refreshForIgnoredFlip()
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
        let toIgnore = ignoreProfitMap[trackedFlip.uId.toString(16)] || false
        return (
            <ListGroup.Item
                className={styles.listGroupItem}
                onContextMenu={handleContextMenuForTrackedFlip}
                id={trackedFlip.uId.toString(16)}
                style={{
                    borderColor: props.highlightedFlipUid === trackedFlip.uId.toString(16) ? 'cornflowerblue' : undefined,
                    borderWidth: props.highlightedFlipUid === trackedFlip.uId.toString(16) ? 5 : undefined
                }}
            >
                <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', fontSize: 'x-large' }}>
                    <div
                        className="ellipse"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            router.push(`/item/${trackedFlip.item.tag}`)
                        }}
                    >
                        <Image
                            crossOrigin="anonymous"
                            src={trackedFlip.item.iconUrl || ''}
                            height="36"
                            width="36"
                            alt=""
                            style={{ marginRight: '5px' }}
                            loading="lazy"
                        />
                        <span style={{ whiteSpace: 'nowrap', ...getStyleForTier(trackedFlip.item.tier) }}>
                            {getMinecraftColorCodedElement(trackedFlip.item.name)}
                        </span>
                    </div>
                    {trackedFlip.profit > 0 ? (
                        <span style={{ color: 'lime', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                            +<Number number={trackedFlip.profit} /> Coins
                        </span>
                    ) : (
                        <span style={{ color: 'red', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                            <Number number={trackedFlip.profit} /> Coins
                        </span>
                    )}
                </h1>
                <hr />
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <Card className={styles.profitNumberCard}>
                        <a href={`/auction/${trackedFlip.originAuction}`} target={'_blank'} className="disableLinkStyle">
                            <Card.Header className={styles.profitNumberHeader}>
                                <Card.Title style={{ margin: 0 }}>
                                    <Number number={trackedFlip.pricePaid} /> Coins
                                </Card.Title>
                            </Card.Header>
                        </a>
                    </Card>
                    <ArrowRightIcon style={{ fontSize: '50px' }} />
                    <Card className={styles.profitNumberCard}>
                        <a href={`/auction/${trackedFlip.soldAuction}`} target={'_blank'} className="disableLinkStyle">
                            <Card.Header className={styles.profitNumberHeader}>
                                <Card.Title style={{ margin: 0 }}>
                                    <Number number={trackedFlip.soldFor} /> Coins
                                </Card.Title>
                            </Card.Header>
                        </a>
                    </Card>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ marginTop: '10px' }}>
                            <Tooltip
                                content={
                                    <span>
                                        Finder: <Badge bg="dark">{trackedFlip.finder.shortLabel}</Badge>
                                    </span>
                                }
                                tooltipContent={
                                    <span>
                                        This is the first flip finder algorithm that reported this flip. Its possible that you used another one or even found
                                        this flip on your own
                                    </span>
                                }
                                type={'hover'}
                            />
                            <span style={{ marginLeft: '15px' }}>
                                <Tooltip
                                    type="hover"
                                    content={
                                        <span>
                                            <span className={styles.label}></span>Sold {moment(trackedFlip.sellTime).fromNow()}
                                        </span>
                                    }
                                    tooltipContent={<span>{trackedFlip.sellTime.toLocaleDateString() + ' ' + trackedFlip.sellTime.toLocaleTimeString()}</span>}
                                />
                            </span>
                        </p>
                        <p
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                let flips = [...trackedFlips]
                                trackedFlip.showPropertyChanges = !trackedFlip.showPropertyChanges
                                setTrackedFlips(flips)
                            }}
                        >
                            Profit changes: {trackedFlip.showPropertyChanges ? <ArrowDownIcon /> : <ArrowRightIcon />}
                        </p>
                        {trackedFlip.showPropertyChanges ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Table>
                                    <tbody>
                                        {trackedFlip.propertyChanges.map(change => (
                                            <tr>
                                                <td>{change.description}</td>
                                                <td>
                                                    {' '}
                                                    {change.effect > 0 ? (
                                                        <span style={{ color: 'lime', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                                                            +<Number number={change.effect} /> Coins
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'red', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                                                            <Number number={change.effect} />
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : null}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end' }}>
                        <Suspense>
                            <FlipTrackingCopyButton trackedFlip={trackedFlip} />
                        </Suspense>
                    </div>
                </div>
                {toIgnore ? (
                    <>
                        <hr />
                        <p style={{ color: 'yellow' }}>
                            <b>This flip is ignored from the profit calculation</b>
                            <Button
                                variant="info"
                                style={{ marginLeft: '10px' }}
                                onClick={() => {
                                    delete ignoreProfitMap[trackedFlip.uId.toString(16)]
                                    setSetting(IGNORE_FLIP_TRACKING_PROFIT, JSON.stringify(ignoreProfitMap))
                                    setIgnoreProfitMap(ignoreProfitMap)
                                    refreshForIgnoredFlip()
                                    forceUpdate()
                                }}
                            >
                                Re-Add
                            </Button>
                        </p>
                    </>
                ) : null}
            </ListGroup.Item>
        )
    })

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
        let newTotalProfit = 0
        Promise.all(promises).then(results => {
            results.forEach(result => {
                newFlips.push(...result.flips)
                newTotalProfit += result.totalProfit
            })
            setTotalProfit(newTotalProfit)
            setIsLoading(false)
            setTrackedFlips(newFlips)
        })
    }

    function onAfterLogin() {
        api.refreshLoadPremiumProducts(products => {
            setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM))
        })
    }

    return (
        <div>
            <b>
                <p style={{ fontSize: 'x-large' }}>
                    Total Profit:{' '}
                    <span style={{ color: 'gold' }}>
                        <Number number={totalProfit} /> Coins{' '}
                    </span>
                </p>
            </b>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <Form.Select style={{ width: 'auto', marginTop: '20px' }} defaultValue={orderBy.value} onChange={updateOrderBy}>
                    {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
                {hasPremium ? (
                    <div style={{ display: 'flex' }}>
                        <div style={{ paddingRight: 15 }}>
                            <label style={{ marginRight: 15 }}>From: </label>
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
            {currentItemContextMenuElement}
            <div style={{ visibility: 'collapse', height: 0 }}>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
            </div>
        </div>
    )
}
