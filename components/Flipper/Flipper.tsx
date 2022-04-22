import React, { useEffect, useRef, useState } from 'react'
import api from '../../api/ApiHelper'
import { Button, Card, Form, Modal } from 'react-bootstrap'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import FlipperFilter from './FlipperFilter/FlipperFilter'
import { getLoadingElement } from '../../utils/LoadingUtils'
import {
    KeyboardTab as ArrowRightIcon,
    Delete as DeleteIcon,
    Help as HelpIcon,
    Settings as SettingsIcon,
    PanTool as HandIcon,
    Search as SearchIcon
} from '@mui/icons-material'
import FlipBased from './FlipBased/FlipBased'
import { CopyButton } from '../CopyButton/CopyButton'
import { FixedSizeList as List } from 'react-window'
import Tooltip from '../Tooltip/Tooltip'
import Flip from './Flip/Flip'
import FlipCustomize from './FlipCustomize/FlipCustomize'
import { calculateProfit, DEFAULT_FLIP_SETTINGS, DEMO_FLIP, getFlipCustomizeSettings } from '../../utils/FlipUtils'
import { Menu, Item, useContextMenu, theme } from 'react-contexify'
import { FLIPPER_FILTER_KEY, getSetting, getSettingsObject, RESTRICTIONS_SETTINGS_KEY, setSetting, setSettingsChangedData } from '../../utils/SettingsUtils'
import Countdown, { zeroPad } from 'react-countdown'
import styles from './Flipper.module.css'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AutoSizer from 'react-virtualized-auto-sizer'
import AuctionDetails from '../AuctionDetails/AuctionDetails'
import { v4 as generateUUID } from 'uuid'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import FlipperFAQ from './FlipperFAQ/FlipperFAQ'

// Not a state
// Update should not trigger a rerender for performance reasons
let missedInfo: FreeFlipperMissInformation = {
    estimatedProfitCopiedAuctions: 0,
    missedEstimatedProfit: 0,
    missedFlipsCount: 0,
    totalFlips: 0
}

let mounted = true

const FLIP_CONEXT_MENU_ID = 'flip-context-menu'

interface Props {
    flips?: FlipAuction[]
}

function Flipper(props: Props) {
    let [flips, setFlips] = useState<FlipAuction[]>(props.flips || [])
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [flipperFilter, setFlipperFilter] = useState<FlipperFilter>(getInitialFlipperFilter())
    let [autoscroll, setAutoscroll] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)
    let [enabledScroll, setEnabledScroll] = useState(false)
    let [isLoading, setIsLoading] = useState(false)
    let [refInfo, setRefInfo] = useState<RefInfo>()
    let [basedOnAuction, setBasedOnAuction] = useState<FlipAuction | null>(null)
    let [showCustomizeFlip, setShowCustomizeFlip] = useState(false)
    let [lastFlipFetchTimeSeconds, setLastFlipFetchTimeSeconds] = useState<number>()
    let [lastFlipFetchTimeLoading, setLastFlipFetchTimeLoading] = useState<boolean>(false)
    let [countdownDateObject, setCountdownDateObject] = useState<Date>()
    let [isSmall, setIsSmall] = useState(false)
    let [selectedAuctionUUID, setSelectedAuctionUUID] = useState('')
    let [isSSR, setIsSSR] = useState(true)
    let [showResetToDefaultDialog, setShowResetToDefaultDialog] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    let [flipperFilterKey, setFlipperFilterKey] = useState<string>(generateUUID())
    let [flipCustomizeKey, setFlipCustomizeKey] = useState<string>(generateUUID())

    let router = useRouter()

    const { show } = useContextMenu({
        id: FLIP_CONEXT_MENU_ID
    })

    const listRef = useRef(null)

    const autoscrollRef = useRef(autoscroll)
    autoscrollRef.current = autoscroll

    const flipLookup = {}

    useEffect(() => {
        setIsSSR(false)

        mounted = true
        _setAutoScroll(true)
        attachScrollEvent()
        isSSR = false
        api.subscribeFlips(flipperFilter.restrictions || [], flipperFilter, getFlipCustomizeSettings(), onNewFlip, onAuctionSold, onNextFlipNotification)
        getLastFlipFetchTime()

        document.addEventListener(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE, e => {
            if ((e as any).detail?.apiUpdate) {
                setFlipperFilterKey(generateUUID())
                setFlipCustomizeKey(generateUUID())
            }
        })

        setIsSmall(document.body.clientWidth < 1000)

        return () => {
            mounted = false
            api.unsubscribeFlips()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (localStorage.getItem('googleId') !== null && !isLoggedIn) {
            setIsLoading(true)
        }
    }, [wasAlreadyLoggedIn, isLoggedIn])

    function handleFlipContextMenu(event, flip: FlipAuction) {
        event.preventDefault()
        show(event, {
            props: {
                flip: flip
            }
        })
    }

    let loadHasPremium = () => {
        let googleId = localStorage.getItem('googleId')
        api.hasPremium(googleId!).then(hasPremiumUntil => {
            if (hasPremiumUntil > new Date()) {
                setHasPremium(true)
                // subscribe to the premium flips
                api.subscribeFlips(
                    flipperFilter.restrictions || [],
                    flipperFilter,
                    getFlipCustomizeSettings(),
                    onNewFlip,
                    onAuctionSold,
                    onNextFlipNotification
                )
            }
            setIsLoading(false)
        })
    }

    function getInitialFlipperFilter(): FlipperFilter {
        let filter = getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {})
        filter.restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, [])
        return filter
    }

    function onLogin() {
        setIsLoggedIn(true)
        setIsLoading(true)
        loadHasPremium()
        api.getRefInfo().then(refInfo => {
            setRefInfo(refInfo)
        })
    }

    function onLoginFail() {
        setIsLoading(false)
    }

    function onArrowRightClick() {
        if (listRef && listRef.current) {
            ;(listRef!.current! as any).scrollToItem(flips?.length - 1)
        }
    }

    function _setAutoScroll(value: boolean) {
        if (value === true) {
            onArrowRightClick()
        }
        autoscroll = value
        setAutoscroll(value)
    }

    function attachScrollEvent(scrollContainer: Element | null = null) {
        if (isSSR) {
            return
        }

        if (enabledScroll) return
        if (!scrollContainer)
            scrollContainer =
                document.getElementsByClassName(styles.flipperScrollList).length > 0 ? document.getElementsByClassName(styles.flipperScrollList).item(0) : null
        if (scrollContainer) {
            scrollContainer.addEventListener('wheel', evt => {
                evt.preventDefault()
                let scrollAmount = 0
                var slideTimer = setInterval(() => {
                    scrollContainer!.scrollLeft += (evt as WheelEvent).deltaY / 10
                    scrollAmount += Math.abs((evt as WheelEvent).deltaY) / 10
                    if (scrollAmount >= Math.abs((evt as WheelEvent).deltaY)) {
                        clearInterval(slideTimer)
                    }
                }, 25)
            })
            setEnabledScroll(true)
            enabledScroll = true
        }
    }

    function clearFlips() {
        setFlips(() => {
            return []
        })
    }

    function onAuctionSold(uuid: string) {
        if (!mounted) {
            return
        }
        setFlips(flips => {
            let index = flips.findIndex(a => a.uuid === uuid)
            if (index === -1) {
                return flips
            }

            flips[index].sold = true
            if (flips[index] && flipperFilter.onlyUnsold) {
                flips.splice(index, 1)
                return flips
            }
            return flips
        })
    }

    function getLastFlipFetchTime() {
        setLastFlipFetchTimeLoading(true)
        api.getFlipUpdateTime().then(date => {
            setLastFlipFetchTimeSeconds(date.getSeconds() % 60)
            setLastFlipFetchTimeLoading(false)
        })
    }

    function onNextFlipNotification() {
        setTimeout(() => {
            let d = new Date()
            d = new Date(d.getTime() + 10_000)
            setLastFlipFetchTimeSeconds(d.getSeconds())
        }, 200)
    }

    function getCountdownDateObject(): Date {
        let d = new Date()
        if (countdownDateObject && countdownDateObject.getTime() > new Date().getTime() && countdownDateObject.getSeconds() === lastFlipFetchTimeSeconds) {
            return countdownDateObject
        }
        d.setSeconds(lastFlipFetchTimeSeconds!)
        if (d.getSeconds() < new Date().getSeconds()) {
            d.setMinutes(new Date().getMinutes() + 1)
        } else {
            d.setMinutes(new Date().getMinutes())
        }
        setLastFlipFetchTimeLoading(true)
        setTimeout(() => {
            setCountdownDateObject(d)
            setLastFlipFetchTimeLoading(false)
        }, 200)
        return d
    }

    function onCountdownComplete() {
        setLastFlipFetchTimeLoading(true)
        setTimeout(() => {
            setLastFlipFetchTimeLoading(false)
        }, 200)
    }

    function onNewFlip(newFlipAuction: FlipAuction) {
        if (flipLookup[newFlipAuction.uuid] || !mounted) {
            return
        }

        if (flipperFilter.onlyUnsold && newFlipAuction.sold) {
            return
        }

        flipLookup[newFlipAuction.uuid] = newFlipAuction

        newFlipAuction.item.iconUrl = api.getItemImageUrl(newFlipAuction.item)
        newFlipAuction.showLink = true

        missedInfo = {
            estimatedProfitCopiedAuctions: missedInfo.estimatedProfitCopiedAuctions,
            missedEstimatedProfit: newFlipAuction.sold ? missedInfo.missedEstimatedProfit + calculateProfit(newFlipAuction) : missedInfo.missedEstimatedProfit,
            missedFlipsCount: newFlipAuction.sold ? missedInfo.missedFlipsCount + 1 : missedInfo.missedFlipsCount,
            totalFlips: missedInfo.totalFlips + 1
        }

        setFlips(flips => [...flips, newFlipAuction])

        if (autoscrollRef.current) {
            let element =
                document.getElementsByClassName(styles.flipperScrollList).length > 0 ? document.getElementsByClassName(styles.flipperScrollList).item(0) : null
            if (element) {
                element.scrollBy({ left: 16000, behavior: 'smooth' })
                attachScrollEvent(element)
            }
        }
    }

    function onFilterChange(newFilter) {
        flipperFilter = newFilter
        setFlipperFilter(newFilter)
        setTimeout(() => {
            setFlips([])

            setTimeout(() => {
                if (listRef && listRef.current) {
                    ;(listRef!.current! as any).scrollToItem(flips.length - 1)
                }
            })
        })
    }

    function onCopyFlip(flip: FlipAuction) {
        let settings = getFlipCustomizeSettings()
        let currentMissedInfo = missedInfo
        currentMissedInfo.estimatedProfitCopiedAuctions += calculateProfit(flip, settings.useLowestBinForProfit)
        flip.isCopied = true
        setFlips(flips)
    }

    function getFlipForList(listData) {
        let { data, index, style } = listData
        let { flips } = data

        return <div key={'flip-' + index}>{getFlipElement(flips[index], style)}</div>
    }

    function addItemToBlacklist(flip: FlipAuction) {
        let restrictions = getSetting(RESTRICTIONS_SETTINGS_KEY, '[]')
        let parsed: FlipRestriction[]
        try {
            parsed = JSON.parse(restrictions)
        } catch {
            parsed = []
        }
        parsed.push({
            type: 'blacklist',
            item: flip.item,
            itemFilter: {}
        })

        if (flipperFilter) {
            setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(parsed))
            flipperFilter.restrictions = parsed
            onFilterChange(flipperFilter)
        } else {
            setTimeout(addItemToBlacklist, 500)
        }
    }

    function redirectToSeller(sellerName: string) {
        router.push({
            pathname: 'player/' + sellerName
        })
    }

    function resetSettingsToDefault() {
        api.subscribeFlips(
            DEFAULT_FLIP_SETTINGS.RESTRICTIONS,
            DEFAULT_FLIP_SETTINGS.FILTER,
            DEFAULT_FLIP_SETTINGS.FLIP_CUSTOMIZE,
            undefined,
            undefined,
            undefined,
            () => {
                window.location.reload()
            },
            true
        )
        localStorage.removeItem('userSettings')
    }

    let getFlipElement = (flipAuction: FlipAuction, style) => {
        if (!flipAuction) {
            return <div />
        }
        return (
            <div onContextMenu={e => handleFlipContextMenu(e, flipAuction)}>
                <Flip
                    flip={flipAuction}
                    style={{
                        ...style,
                        padding: '10px'
                    }}
                    onCopy={onCopyFlip}
                    onCardClick={flip => setSelectedAuctionUUID(flip.uuid)}
                    onBasedAuctionClick={flip => {
                        setBasedOnAuction(flip)
                    }}
                />
            </div>
        )
    }

    let basedOnDialog =
        basedOnAuction === null ? null : (
            <Modal
                size={'xl'}
                show={basedOnAuction !== null}
                onHide={() => {
                    setBasedOnAuction(null)
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Auctions used for calculating the median price</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FlipBased flip={basedOnAuction} />
                </Modal.Body>
            </Modal>
        )

    let customizeFlipDialog = (
        <Modal
            size={'xl'}
            show={showCustomizeFlip}
            onHide={() => {
                setShowCustomizeFlip(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Customize the style of flips</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FlipCustomize key={flipCustomizeKey} />
            </Modal.Body>
        </Modal>
    )

    let flipContextMenu = (
        <div>
            <Menu id={FLIP_CONEXT_MENU_ID} theme={theme.dark}>
                <Item
                    onClick={params => {
                        addItemToBlacklist(params.props.flip as FlipAuction)
                    }}
                >
                    <HandIcon style={{ color: 'red', marginRight: '5px' }} /> Add Item to Blacklist
                </Item>
                <Item
                    onClick={params => {
                        redirectToSeller((params.props.flip as FlipAuction).sellerName)
                    }}
                >
                    <SearchIcon style={{ marginRight: '5px' }} />
                    Open seller auction history
                </Item>
            </Menu>
        </div>
    )

    let resetSettingsElement = (
        <span>
            Reset Flipper settings back to default
            <Button
                style={{ marginLeft: '5px' }}
                onClick={() => {
                    setShowResetToDefaultDialog(true)
                }}
            >
                Reset
            </Button>
            <Modal
                show={showResetToDefaultDialog}
                onHide={() => {
                    setShowResetToDefaultDialog(false)
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Confirmation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to reset all the flipper settings?</p>
                    <p>
                        <b>This will delete all your filter, settings and black-/whitelist.</b>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button variant="danger" style={{ width: '45%' }} onClick={resetSettingsToDefault}>
                            RESET <DeleteIcon />
                        </Button>
                        <Button
                            style={{ width: '45%' }}
                            onClick={() => {
                                setShowResetToDefaultDialog(false)
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </span>
    )

    return (
        <div className={styles.flipper}>
            <Card>
                <Card.Header>
                    <Card.Title>
                        {isLoading ? (
                            getLoadingElement(<p>Logging in with Google...</p>)
                        ) : !isLoggedIn ? (
                            <h2>Free Auction Flipper</h2>
                        ) : hasPremium ? (
                            'You have premium and receive profitable auctions in real time.'
                        ) : (
                            <span>
                                These auctions are delayed by 5 min. Please purchase{' '}
                                <a target="_blank" rel="noreferrer" href="/premium">
                                    premium
                                </a>{' '}
                                if you want real time flips.
                            </span>
                        )}
                        <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
                    </Card.Title>
                    {!isLoading && !hasPremium ? (
                        <Card.Subtitle>
                            You need to be logged and have Premium to have all <Link href="/premium">features</Link> unlocked.
                        </Card.Subtitle>
                    ) : null}
                </Card.Header>
                <Card.Body>
                    <div id="flipper-card-body">
                        <FlipperFilter key={flipperFilterKey} onChange={onFilterChange} isLoggedIn={isLoggedIn} isPremium={hasPremium} />
                        <hr />
                        <Form className={styles.flipperSettingsForm}>
                            <Form.Group>
                                <Form.Label htmlFor="autoScrollCheckbox" style={{ marginRight: '10px' }}>
                                    Auto-Scroll?
                                </Form.Label>
                                <Form.Check
                                    style={{ display: 'inline' }}
                                    id="autoScrollCheckbox"
                                    checked={autoscroll}
                                    onChange={e => {
                                        _setAutoScroll(e.target.checked)
                                    }}
                                    type="checkbox"
                                />
                            </Form.Group>
                            <Form.Group>
                                <div style={{ display: 'contents', cursor: 'pointer', marginRight: '10px' }} onClick={clearFlips}>
                                    <Form.Label>Clear flips!</Form.Label>
                                    <DeleteIcon color="error" />
                                </div>
                            </Form.Group>
                            <Form.Group
                                onClick={() => {
                                    setShowCustomizeFlip(true)
                                }}
                            >
                                <Form.Label style={{ cursor: 'pointer', marginRight: '10px' }}>Settings</Form.Label>
                                <span style={{ cursor: 'pointer' }}>
                                    {' '}
                                    <SettingsIcon />
                                </span>
                            </Form.Group>
                            {hasPremium ? (
                                <span>
                                    Next update:{' '}
                                    {lastFlipFetchTimeSeconds && !lastFlipFetchTimeLoading ? (
                                        <Countdown
                                            date={getCountdownDateObject()}
                                            onComplete={onCountdownComplete}
                                            renderer={({ seconds }) => <span>{zeroPad(seconds)}</span>}
                                        />
                                    ) : (
                                        '...'
                                    )}
                                </span>
                            ) : (
                                ''
                            )}
                            <Form.Group onClick={onArrowRightClick}>
                                <Form.Label style={{ cursor: 'pointer', marginRight: '10px' }}>To newest flip</Form.Label>
                                <span style={{ cursor: 'pointer' }}>
                                    {' '}
                                    <ArrowRightIcon />
                                </span>
                            </Form.Group>
                        </Form>
                        <hr />
                        {!isSSR ? (
                            <div
                                id="flipper-scroll-list-wrapper"
                                style={{ height: document.getElementById('maxHeightDummyFlip')?.offsetHeight, width: '100%' }}
                            >
                                <AutoSizer>
                                    {({ height, width }) => (
                                        <List
                                            ref={listRef}
                                            className={styles.flipperScrollList}
                                            height={height}
                                            itemCount={flips.length}
                                            itemData={{ flips: flips }}
                                            itemSize={isSmall ? 300 : 330}
                                            layout="horizontal"
                                            width={width}
                                        >
                                            {getFlipForList}
                                        </List>
                                    )}
                                </AutoSizer>
                            </div>
                        ) : (
                            <div className={`${styles.SSRcardsWrapper} ${styles.flipperScrollList}`}>
                                {flips.map((flip, index) => {
                                    return <span key={'flip' + index}>{getFlipElement(flip, { width: '300px', height: '100%' })}</span>
                                })}
                            </div>
                        )}
                    </div>
                </Card.Body>
                <Card.Footer>
                    This flipper is work in progress (open beta). Anything you see here is subject to change. Please leave suggestions and opinions on our{' '}
                    <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                        discord
                    </a>
                    .
                    <hr />
                    {isLoggedIn ? (
                        ''
                    ) : (
                        <div>
                            <span>
                                These are flips that were previosly found (~5 min ago). Anyone can use these and there is no cap on estimated profit. Keep in
                                mind that these are delayed to protect our paying supporters. If you want more recent flips purchase our{' '}
                                <a target="_blank" rel="noreferrer" href="/premium">
                                    premium plan.
                                </a>
                            </span>
                            <hr />
                        </div>
                    )}
                    {resetSettingsElement}
                </Card.Footer>
            </Card>
            {selectedAuctionUUID ? (
                <div>
                    <hr />
                    <Card className="card">
                        <Card.Header>
                            <Card.Title>Auction-Details</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <AuctionDetails auctionUUID={selectedAuctionUUID} retryCounter={5} />
                        </Card.Body>
                    </Card>
                </div>
            ) : (
                ''
            )}
            <div>
                <hr />
                <Card>
                    <Card.Header>
                        <Card.Title>Flipper summary</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className={styles.flipperSummaryWrapper}>
                            <Card className={styles.flipperSummaryCard}>
                                <Card.Header>
                                    <Card.Title>You got:</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ul>
                                        <li>Total flips received: {numberWithThousandsSeperators(missedInfo.totalFlips)}</li>
                                        <li>Profit of copied flips: {numberWithThousandsSeperators(missedInfo.estimatedProfitCopiedAuctions)} Coins</li>
                                    </ul>
                                </Card.Body>
                            </Card>
                            {!isLoading && isLoggedIn && !hasPremium ? (
                                <Card className={styles.flipperSummaryCard}>
                                    <Card.Header>
                                        <Card.Title>You don't have Premium</Card.Title>
                                    </Card.Header>
                                    <Card.Body>
                                        <ul>
                                            <li>
                                                <span style={{ marginRight: '10px' }}>
                                                    Missed Profit: {numberWithThousandsSeperators(missedInfo.missedEstimatedProfit)} Coins
                                                </span>
                                                <Tooltip
                                                    type="hover"
                                                    content={<HelpIcon />}
                                                    tooltipContent={
                                                        <span>
                                                            This is the sum of the field 'Estimated profit' of the flips that were already sold when you
                                                            received them. It represents the extra coins you could earn if you purchased our premium plan
                                                        </span>
                                                    }
                                                />
                                            </li>
                                            <li>Missed Flips: {numberWithThousandsSeperators(missedInfo.missedFlipsCount)}</li>
                                        </ul>
                                    </Card.Body>
                                </Card>
                            ) : null}
                            <Card style={{ flexGrow: 2 }} className={styles.flipperSummaryCard}>
                                <Card.Header>
                                    {!isLoading && isLoggedIn && hasPremium ? (
                                        <Card.Title>How to get extra premium time for free</Card.Title>
                                    ) : (
                                        <Card.Title>How to get premium for free</Card.Title>
                                    )}
                                </Card.Header>
                                <Card.Body>
                                    <p>
                                        Get free premium time by inviting other people to our website. For further information check out our{' '}
                                        <Link href="/ref">Referral-Program</Link>.
                                    </p>
                                    <p>
                                        Your Link to invite people:{' '}
                                        <span style={{ fontStyle: 'italic', color: 'skyblue' }}>
                                            {!isSSR ? window.location.href.split('?')[0] + '?refId=' + refInfo?.oldInfo.refId : ''}
                                        </span>{' '}
                                        <CopyButton
                                            copyValue={!isSSR ? window.location.href.split('?')[0] + '?refId=' + refInfo?.oldInfo.refId : ''}
                                            successMessage={<span>Copied Ref-Link</span>}
                                        />
                                    </p>
                                </Card.Body>
                            </Card>
                        </div>
                    </Card.Body>
                </Card>
            </div>
            <hr />
            <FlipperFAQ />
            <div id="maxHeightDummyFlip" style={{ position: 'absolute', top: -1000, padding: '20px', zIndex: -1 }}>
                <Flip flip={DEMO_FLIP} />
            </div>
            {basedOnDialog}
            {customizeFlipDialog}
            {flipContextMenu}
        </div>
    )
}

export default Flipper
