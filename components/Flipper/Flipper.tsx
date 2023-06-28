'use client'
import DeleteIcon from '@mui/icons-material/Delete'
import HelpIcon from '@mui/icons-material/Help'
import ArrowRightIcon from '@mui/icons-material/KeyboardTab'
import HandIcon from '@mui/icons-material/PanTool'
import SearchIcon from '@mui/icons-material/Search'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Form, Modal } from 'react-bootstrap'
import { Item, Menu, useContextMenu } from 'react-contexify'
import Countdown, { zeroPad } from 'react-countdown'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List } from 'react-window'
import { v4 as generateUUID } from 'uuid'
import api from '../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'
import { calculateProfit, DEFAULT_FLIP_SETTINGS, DEMO_FLIP, getFlipCustomizeSettings } from '../../utils/FlipUtils'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { getHighestPriorityPremiumProduct, getPremiumType, hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { FLIPPER_FILTER_KEY, getSetting, getSettingsObject, handleSettingsImport, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../utils/SettingsUtils'
import AuctionDetails from '../AuctionDetails/AuctionDetails'
import { CopyButton } from '../CopyButton/CopyButton'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { Number } from '../Number/Number'
import Tooltip from '../Tooltip/Tooltip'
import Flip from './Flip/Flip'
import FlipBased from './FlipBased/FlipBased'
import styles from './Flipper.module.css'
import FlipperFAQ from './FlipperFAQ/FlipperFAQ'
import FlipperFilter from './FlipperFilter/FlipperFilter'
import { useRouter } from 'next/navigation'
import { parseFlipAuction } from '../../utils/Parser/APIResponseParser'

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
    flips?: any[]
}

function Flipper(props: Props) {
    let [flipperFilter, setFlipperFilter] = useState<FlipperFilter>(getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {}))
    let [flips, setFlips] = useState<FlipAuction[]>(
        props.flips
            ? props.flips.map(parseFlipAuction).filter(flip => {
                  return flipperFilter.onlyUnsold ? !flip.sold : true
              })
            : []
    )
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [autoscroll, setAutoscroll] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)
    let [activePremiumProduct, setActivePremiumProduct] = useState<PremiumProduct>()
    let [enabledScroll, setEnabledScroll] = useState(false)
    let [isLoading, setIsLoading] = useState(false)
    let [refInfo, setRefInfo] = useState<RefInfo>()
    let [basedOnAuction, setBasedOnAuction] = useState<FlipAuction | null>(null)
    let [lastFlipFetchTimeSeconds, setLastFlipFetchTimeSeconds] = useState<number>()
    let [lastFlipFetchTimeLoading, setLastFlipFetchTimeLoading] = useState<boolean>(false)
    let [countdownDateObject, setCountdownDateObject] = useState<Date>()
    let [isSmall, setIsSmall] = useState(false)
    let [selectedAuctionUUID, setSelectedAuctionUUID] = useState('')
    let [isSSR, setIsSSR] = useState(true)
    let [showResetToDefaultDialog, setShowResetToDefaultDialog] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    let [flipperFilterKey, setFlipperFilterKey] = useState<string>(generateUUID())

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
        api.subscribeFlipsAnonym(
            getSettingsObject(RESTRICTIONS_SETTINGS_KEY, []),
            getSettingsObject(FLIPPER_FILTER_KEY, {}),
            getFlipCustomizeSettings(),
            onNewFlip,
            onAuctionSold,
            onNextFlipNotification
        )
        getLastFlipFetchTime()

        document.addEventListener(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE, e => {
            if ((e as any).detail?.apiUpdate) {
                setFlipperFilterKey(generateUUID())
            }
            if (sessionStorage.getItem('googleId') === null) {
                api.subscribeFlipsAnonym(
                    getSettingsObject(RESTRICTIONS_SETTINGS_KEY, []) || [],
                    getSettingsObject(FLIPPER_FILTER_KEY, {}),
                    getFlipCustomizeSettings(),
                    onNewFlip,
                    onAuctionSold,
                    onNextFlipNotification
                )
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
        if (sessionStorage.getItem('googleId') !== null && !isLoggedIn) {
            setFlips([])
            setIsLoading(true)
        }
    }, [wasAlreadyLoggedIn, isLoggedIn])

    function handleFlipContextMenu(event, flip: FlipAuction) {
        event.preventDefault()
        show({
            event: event,
            props: {
                flip: flip
            }
        })
    }

    let loadHasPremium = () => {
        api.getPremiumProducts().then(products => {
            setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
            setActivePremiumProduct(getHighestPriorityPremiumProduct(products))
            // subscribe to the premium flips
            api.subscribeFlips(
                getSettingsObject(RESTRICTIONS_SETTINGS_KEY, []) || [],
                flipperFilter,
                getFlipCustomizeSettings(),
                onNewFlip,
                onAuctionSold,
                onNextFlipNotification
            )
            setIsLoading(false)
        })
    }

    function onLogin() {
        setFlips([])
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
        ;(listRef.current as any).scrollToItem(flips.length - 1)
    }

    function _setAutoScroll(value: boolean) {
        if (value === true) {
            onArrowRightClick()
        }
        autoscroll = value
        setAutoscroll(value)
    }

    function attachScrollEvent(scrollContainer: Element | null = null) {
        if (isSSR || enabledScroll) {
            return
        }
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
        setFlips([])
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
        setFlipperFilter(newFilter)
        setFlips([])
        ;(listRef.current as any)?.scrollToItem(flips.length - 1)
    }

    function onCopyFlip(flip: FlipAuction) {
        let settings = getFlipCustomizeSettings()
        let currentMissedInfo = missedInfo
        currentMissedInfo.estimatedProfitCopiedAuctions += calculateProfit(flip, settings)
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
            item: {
                tag: flip.item.tag,
                name: flip.item.name
            },
            itemFilter: {}
        })

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(parsed))
        onFilterChange(flipperFilter)
    }

    function redirectToSeller(sellerName: string) {
        router.push('/player/' + sellerName)
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

    function getCardTitleElement() {
        if (isLoading) {
            return getLoadingElement(<p>Logging in with Google...</p>)
        }
        if (!isLoggedIn) {
            return <h2>Free Auction Flipper</h2>
        }
        if (hasPremium) {
            let type = getPremiumType(activePremiumProduct!)
            if (!type) {
                return null
            }
            return (
                <span>
                    You are using{' '}
                    <Link href="/premium">
                        {
                            {
                                1: 'Starter Premium',
                                2: 'Premium',
                                3: 'Premium+'
                            }[type.priority]
                        }
                    </Link>
                </span>
            )
        }
        return (
            <span>
                These auctions are delayed by 5 min. Please purchase{' '}
                <a target="_blank" rel="noreferrer" href="/premium">
                    premium
                </a>{' '}
                if you want real time flips.
            </span>
        )
    }

    function onDrop(e) {
        e.preventDefault()
        var output = '' //placeholder for text output
        let reader = new FileReader()
        let file = e.dataTransfer.items[0].getAsFile()
        if (file) {
            reader.onload = function (e) {
                output = e.target!.result!.toString()
                handleSettingsImport(output)
                //handleSettingsImport(output)
            } //end onload()
            reader.readAsText(file)
        }
        return true
    }

    function onDragOver(e) {
        e.preventDefault()
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
                    <FlipBased auctionUUID={basedOnAuction.uuid} item={basedOnAuction.item} />
                </Modal.Body>
            </Modal>
        )

    let flipContextMenu = (
        <div>
            <Menu id={FLIP_CONEXT_MENU_ID} theme={'dark'}>
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
        <div className={styles.flipper} onDragOver={onDragOver} onDrop={onDrop}>
            <Card>
                <Card.Header>
                    <Card.Title>
                        {getCardTitleElement()}
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
                            {hasPremium ? (
                                <Tooltip
                                    type="hover"
                                    content={
                                        <span>
                                            Next update:{' '}
                                            {lastFlipFetchTimeSeconds !== undefined && !lastFlipFetchTimeLoading ? (
                                                <Countdown
                                                    date={getCountdownDateObject()}
                                                    onComplete={onCountdownComplete}
                                                    renderer={({ seconds }) => <span>{zeroPad(seconds)}</span>}
                                                />
                                            ) : (
                                                '...'
                                            )}
                                        </span>
                                    }
                                    tooltipContent={
                                        <p>
                                            The Hypixel API updates once a minute. This is the estimated time (in seconds) until the next batch of flips will be
                                            shown.
                                        </p>
                                    }
                                />
                            ) : null}
                            {!autoscroll ? (
                                <Form.Group onClick={onArrowRightClick}>
                                    <Form.Label style={{ cursor: 'pointer', marginRight: '10px' }}>To newest flip</Form.Label>
                                    <span style={{ cursor: 'pointer' }}>
                                        {' '}
                                        <ArrowRightIcon />
                                    </span>
                                </Form.Group>
                            ) : null}
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
                    For support and suggestions, join our{' '}
                    <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                        Discord
                    </a>
                    .
                    <hr />
                    {isLoggedIn ? (
                        ''
                    ) : (
                        <div>
                            <span>
                                These are flips that were previously found (~5 min ago). Anyone can use these and there is no cap on estimated profit. Keep in
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
                            <Card.Title>Auction Details</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <AuctionDetails auctionUUID={selectedAuctionUUID} retryCounter={5} />
                        </Card.Body>
                    </Card>
                </div>
            ) : null}
            <div>
                <hr />
                <Card>
                    <Card.Header>
                        <Card.Title>Flipper Summary</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className={styles.flipperSummaryWrapper}>
                            <Card className={styles.flipperSummaryCard}>
                                <Card.Header>
                                    <Card.Title>You got:</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ul>
                                        <li>
                                            Total flips received: <Number number={missedInfo.totalFlips} />
                                        </li>
                                        <li>
                                            Profit of copied flips: <Number number={missedInfo.estimatedProfitCopiedAuctions} /> Coins
                                        </li>
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
                                                    Missed Profit: <Number number={missedInfo.missedEstimatedProfit} /> Coins
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
                                            <li>
                                                Missed Flips: <Number number={missedInfo.missedFlipsCount} />
                                            </li>
                                        </ul>
                                    </Card.Body>
                                </Card>
                            ) : null}
                            {isLoggedIn ? (
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
                                            <Link href="/ref">Referral Program</Link>.
                                        </p>
                                        <p>
                                            Your Link to invite people:{' '}
                                            <span style={{ fontStyle: 'italic', color: 'skyblue' }}>
                                                {!isSSR ? window.location.href.split('?')[0] + '?refId=' + refInfo?.oldInfo.refId : ''}
                                            </span>{' '}
                                            <CopyButton
                                                copyValue={!isSSR ? window.location.href.split('?')[0] + '?refId=' + refInfo?.oldInfo.refId : ''}
                                                successMessage={<span>Copied Referral Link</span>}
                                            />
                                        </p>
                                    </Card.Body>
                                </Card>
                            ) : null}
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
            {flipContextMenu}
        </div>
    )
}

export default Flipper
