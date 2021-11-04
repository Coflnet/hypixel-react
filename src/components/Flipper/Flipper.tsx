import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/ApiHelper';
import './Flipper.css';
import { Card, Form, Modal } from 'react-bootstrap';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import FlipperFilter from './FlipperFilter/FlipperFilter';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { KeyboardTab as ArrowRightIcon, Delete as DeleteIcon, Help as HelpIcon, Settings as SettingsIcon, PanTool as HandIcon, Search as SearchIcon } from '@material-ui/icons';
import FlipBased from './FlipBased/FlipBased';
import { CopyButton } from '../CopyButton/CopyButton';
import AuctionDetails from '../AuctionDetails/AuctionDetails';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { FixedSizeList as List } from 'react-window';
import { Link, useHistory } from 'react-router-dom';
import Tooltip from '../Tooltip/Tooltip';
import Flip from './Flip/Flip';
import FlipCustomize from './FlipCustomize/FlipCustomize';
import { calculateProfit, DEMO_FLIP } from '../../utils/FlipUtils';
import { Menu, Item, useContextMenu, theme } from 'react-contexify';
import { FLIPPER_FILTER_KEY, getSetting, getSettingsObject, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../utils/SettingsUtils';
import Countdown from 'react-countdown';

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

// Not a state
// Update should not trigger a rerender for performance reasons
let missedInfo: FreeFlipperMissInformation = {
    estimatedProfitCopiedAuctions: 0,
    missedEstimatedProfit: 0,
    missedFlipsCount: 0,
    totalFlips: 0
}

let mounted = true;

const FLIP_CONEXT_MENU_ID = 'flip-context-menu';

function Flipper() {

    let [flips, setFlips] = useState<FlipAuction[]>([]);
    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [flipperFilter, setFlipperFilter] = useState<FlipperFilter>(getInitialFlipperFilter());
    let [autoscroll, setAutoscroll] = useState(false);
    let [hasPremium, setHasPremium] = useState(false);
    let [enabledScroll, setEnabledScroll] = useState(false);
    let [selectedAuctionUUID, setSelectedAuctionUUID] = useState("");
    let [isLoading, setIsLoading] = useState(wasAlreadyLoggedInGoogle);
    let [refInfo, setRefInfo] = useState<RefInfo>();
    let [basedOnAuction, setBasedOnAuction] = useState<FlipAuction | null>(null);
    let [showCustomizeFlip, setShowCustomizeFlip] = useState(false);
    let [lastFlipFetchTimeSeconds, setLastFlipFetchTimeSeconds] = useState<number>();
    let [lastFlipFetchTimeLoading, setLastFlipFetchTimeLoading] = useState<boolean>(false);
    let [countdownDateObject, setCountdownDateObject] = useState<Date>();

    let history = useHistory();

    const { show } = useContextMenu({
        id: FLIP_CONEXT_MENU_ID,
    });

    const listRef = useRef(null);

    let isSmall = document.body.clientWidth < 1000;

    const autoscrollRef = useRef(autoscroll);
    autoscrollRef.current = autoscroll;

    /*
    const lastFlipFetchTimeRef = useRef(lastFlipFetchTime);
    lastFlipFetchTimeSRef.current = lastFlipFetchTime;
    const lastFlipFetchTimeLoadingRef = useRef(lastFlipFetchTimeLoading);
    lastFlipFetchTimeLoadingRef.current = lastFlipFetchTimeLoading;
    */

    const flipLookup = {};

    useEffect(() => {
        mounted = true;
        _setAutoScroll(true);
        attachScrollEvent();
        api.subscribeFlips(onNewFlip, flipperFilter.restrictions || [], flipperFilter, uuid => onAuctionSold(uuid), onNextFlipNotification);
        getLastFlipFetchTime();

        document.addEventListener('flipSettingsChange', () => {
            api.subscribeFlips(onNewFlip, flipperFilter.restrictions || [], flipperFilter, uuid => onAuctionSold(uuid), onNextFlipNotification);
        });

        return () => {
            mounted = false;
            api.unsubscribeFlips();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handleFlipContextMenu(event, flip: FlipAuction) {
        event.preventDefault();
        show(event, {
            props: {
                key: 'value',
                flip: flip
            }
        })
    }

    let loadHasPremium = () => {
        let googleId = localStorage.getItem("googleId");
        api.hasPremium(googleId!).then(hasPremiumUntil => {
            if (hasPremiumUntil > new Date()) {
                setHasPremium(true);

                // subscribe to the premium flips
                api.subscribeFlips(onNewFlip, flipperFilter.restrictions || [], flipperFilter, uuid => onAuctionSold(uuid), onNextFlipNotification);
            }
            setIsLoading(false);
        });
    }

    function getInitialFlipperFilter(): FlipperFilter {
        let filter = getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {});
        filter.restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []);
        return filter;
    }

    function onLogin() {
        setIsLoggedIn(true);
        setIsLoading(true);
        loadHasPremium();
        api.getRefInfo().then(refInfo => {
            setRefInfo(refInfo);
        })
    }

    function onLoginFail() {
        setIsLoading(false);
        wasAlreadyLoggedInGoogle = false;
    }

    function onArrowRightClick() {
        if (listRef && listRef.current) {
            (listRef!.current! as any).scrollToItem(flips?.length - 1);
        }
    }

    function _setAutoScroll(value: boolean) {
        if (value === true) {
            onArrowRightClick();
        }
        autoscroll = value;
        setAutoscroll(value);
    }

    function attachScrollEvent(scrollContainer: Element | null = null) {
        if (enabledScroll)
            return;
        if (!scrollContainer)
            scrollContainer = document.getElementById("flip-container");
        if (scrollContainer) {
            scrollContainer.addEventListener("wheel", (evt) => {
                evt.preventDefault();
                let scrollAmount = 0;
                var slideTimer = setInterval(() => {
                    scrollContainer!.scrollLeft += (evt as WheelEvent).deltaY / 10;
                    scrollAmount += Math.abs((evt as WheelEvent).deltaY) / 10;
                    if (scrollAmount >= Math.abs((evt as WheelEvent).deltaY)) {
                        clearInterval(slideTimer);
                    }
                }, 25);
            });
            setEnabledScroll(true);
            enabledScroll = true;
        }
    }

    function clearFlips() {
        setFlips(() => {
            setEnabledScroll(false);
            return [];
        });
    }

    function onAuctionSold(uuid: string) {
        if (!mounted) {
            return;
        }
        setFlips(flips => {
            let index = flips.findIndex(a => a.uuid === uuid);
            if (index !== -1) {
                flips[index].sold = true;
            }

            if (flips[index] && flipperFilter.onlyUnsold) {
                return flips.filter(flip => flip.uuid !== uuid);
            }
            return flips;
        })

        if (!mounted || !flipperFilter.onlyUnsold) {
            return;
        }
        setFlips(flips => {
            return flips.filter(flip => flip.uuid !== uuid);
        })
    }

    function getLastFlipFetchTime() {

        setLastFlipFetchTimeLoading(true);
        api.getFlipUpdateTime().then(date => {
            setLastFlipFetchTimeSeconds(date.getSeconds());
            setLastFlipFetchTimeLoading(false);
        })
    };

    function onNextFlipNotification() {
        setLastFlipFetchTimeLoading(true);
        setTimeout(() => {
            let d = new Date();
            d = new Date(d.getTime() + 10_000);
            setLastFlipFetchTimeSeconds(d.getSeconds());
            setLastFlipFetchTimeLoading(false);
        }, 200);
    }

    function getCountdownDateObject(): Date {

        let d = new Date();
        if (countdownDateObject && (countdownDateObject.getTime() > new Date().getTime() && countdownDateObject.getSeconds() === lastFlipFetchTimeSeconds)) {
            return countdownDateObject;
        }
        d.setSeconds(lastFlipFetchTimeSeconds!);
        if (d.getSeconds() < new Date().getSeconds()) {
            d.setMinutes(new Date().getMinutes() + 1);
        } else {
            d.setMinutes(new Date().getMinutes());
        }
        setLastFlipFetchTimeLoading(true);
        setTimeout(() => {
            setCountdownDateObject(d);
            setLastFlipFetchTimeLoading(false);
        }, 200);
        return d;
    }

    function onCountdownComplete() {
        setLastFlipFetchTimeLoading(true);
        setTimeout(() => {
            setLastFlipFetchTimeLoading(false);
        }, 200);
    }

    function onNewFlip(newFlipAuction: FlipAuction) {

        if (flipLookup[newFlipAuction.uuid] || !mounted) {
            return;
        }

        if (flipperFilter.onlyUnsold && newFlipAuction.sold) {
            return;
        }

        flipLookup[newFlipAuction.uuid] = newFlipAuction;

        api.getItemImageUrl(newFlipAuction.item).then((url) => {

            newFlipAuction.item.iconUrl = url;
            newFlipAuction.showLink = true;

            missedInfo = {
                estimatedProfitCopiedAuctions: missedInfo.estimatedProfitCopiedAuctions,
                missedEstimatedProfit: newFlipAuction.sold ? missedInfo.missedEstimatedProfit + calculateProfit(newFlipAuction) : missedInfo.missedEstimatedProfit,
                missedFlipsCount: newFlipAuction.sold ? missedInfo.missedFlipsCount + 1 : missedInfo.missedFlipsCount,
                totalFlips: missedInfo.totalFlips + 1
            }

            setFlips(flips => [...flips, newFlipAuction]);

            if (autoscrollRef.current) {
                let element = document.getElementsByClassName('flipper-scroll-list').length > 0 ? document.getElementsByClassName('flipper-scroll-list').item(0) : null;
                if (element) {
                    element.scrollBy({ left: 16000, behavior: 'smooth' })
                    attachScrollEvent(element);
                }
            }
        });
    }

    function onFilterChange(newFilter) {

        flipperFilter = newFilter;
        setFlipperFilter(newFilter);
        setTimeout(() => {

            setFlips([]);

            setTimeout(() => {
                if (listRef && listRef.current) {
                    (listRef!.current! as any).scrollToItem(flips.length - 1);
                }
            })
        })
        api.subscribeFlips(onNewFlip, newFilter.restrictions || [], newFilter, uuid => onAuctionSold(uuid), onNextFlipNotification);
    }

    function onCopyFlip(flip: FlipAuction) {
        let currentMissedInfo = missedInfo;
        currentMissedInfo.estimatedProfitCopiedAuctions += calculateProfit(flip);
        flip.isCopied = true;
        setFlips(flips)
    }

    function getFlipForList(listData) {

        let { data, index, style } = listData;
        let { flips } = data;

        return (<div id="flip-container" className="cards-wrapper">
            {getFlipElement(flips[index], style)}
        </div>)
    };

    function addItemToBlacklist(flip: FlipAuction) {
        let restrictions = getSetting(RESTRICTIONS_SETTINGS_KEY);
        let parsed: FlipRestriction[];
        try {
            parsed = JSON.parse(restrictions);
        } catch {
            parsed = [];
        }
        parsed.push({
            type: "blacklist",
            item: flip.item
        })

        if (flipperFilter) {
            setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(parsed));
            flipperFilter.restrictions = parsed;
            onFilterChange(flipperFilter);
        } else {
            setTimeout(addItemToBlacklist, 500);
        }
    }

    function redirectToSeller(sellerName: string) {
        history.push({
            pathname: "player/" + sellerName
        })
    }

    let getFlipElement = (flipAuction: FlipAuction, style) => {
        return (
            <div onContextMenu={e => handleFlipContextMenu(e, flipAuction)}>
                <Flip flip={flipAuction} style={style} onCopy={onCopyFlip} onCardClick={flip => setSelectedAuctionUUID(flip.uuid)} onBasedAuctionClick={flip => { setBasedOnAuction(flip) }} />
            </div>
        )
    }

    let basedOnDialog = basedOnAuction === null ? null : (
        <Modal size={"xl"} show={basedOnAuction !== null} onHide={() => { setBasedOnAuction(null) }}>
            <Modal.Header closeButton>
                <Modal.Title>Auctions used for calculating the median price</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FlipBased flip={basedOnAuction} />
            </Modal.Body>
        </Modal>
    );

    let customizeFlipDialog = (
        <Modal size={"xl"} show={showCustomizeFlip} onHide={() => { setShowCustomizeFlip(false) }}>
            <Modal.Header closeButton>
                <Modal.Title>Customize the style of flips</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FlipCustomize />
            </Modal.Body>
        </Modal>
    );

    let flipContextMenu = (
        <div>
            <Menu id={FLIP_CONEXT_MENU_ID} theme={theme.dark}>
                <Item onClick={params => { addItemToBlacklist((params.props.flip as FlipAuction)) }}><HandIcon style={{ color: "red", marginRight: "5px" }} /> Add Item to Blacklist</Item>
                <Item onClick={params => { redirectToSeller((params.props.flip as FlipAuction).sellerName) }}><SearchIcon style={{ marginRight: "5px" }} />Open seller auction history</Item>
            </Menu>
        </div>
    );

    return (
        <div className="flipper">
            <Card className="card">
                <Card.Header>
                    <Card.Title>
                        {isLoading ? getLoadingElement(<p>Logging in with Google...</p>) : !isLoggedIn ?
                            <h2>Free Auction Flipper</h2> :
                            hasPremium ? "You have premium and receive profitable auctions in real time." : <span>
                                These auctions are delayed by 5 min. Please purchase <a target="_blank" rel="noreferrer" href="/premium">premium</a> if you want real time flips.
                            </span>
                        }
                        <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
                    </Card.Title>
                    {
                        !isLoading && !hasPremium ?
                            <Card.Subtitle>
                                You need to be logged and have Premium to have all <Link to="/premium">features</Link> unlocked.
                            </Card.Subtitle> : null
                    }
                </Card.Header>
                <Card.Body>
                    <div id="flipper-card-body">
                        <FlipperFilter onChange={onFilterChange} isLoggedIn={isLoggedIn} isPremium={hasPremium} />
                        <hr />
                        <Form className="flipper-settings-form">
                            <Form.Group>
                                <Form.Label htmlFor="autoScrollCheckbox" style={{ marginRight: "10px" }}>Auto-Scroll?</Form.Label>
                                <Form.Check style={{ display: "inline" }} id="autoScrollCheckbox" checked={autoscroll} onChange={(e) => { _setAutoScroll(e.target.checked) }} type="checkbox" />
                            </Form.Group>
                            <Form.Group>
                                <div style={{ display: "contents", cursor: "pointer", marginRight: "10px" }} onClick={clearFlips}>
                                    <Form.Label>Clear flips!</Form.Label>
                                    <DeleteIcon color="error" />
                                </div>
                            </Form.Group>
                            <Form.Group onClick={() => { setShowCustomizeFlip(true) }}>
                                <Form.Label style={{ cursor: "pointer", marginRight: "10px" }}>Settings</Form.Label>
                                <span style={{ cursor: "pointer" }}> <SettingsIcon /></span>
                            </Form.Group>
                            {
                                hasPremium ? <span>Expected new flips in: {lastFlipFetchTimeSeconds && !lastFlipFetchTimeLoading ? <Countdown date={getCountdownDateObject()} onComplete={onCountdownComplete} /> : "..."}</span> : ""
                            }
                            <Form.Group onClick={onArrowRightClick}>
                                <Form.Label style={{ cursor: "pointer", marginRight: "10px" }}>To newest flip</Form.Label>
                                <span style={{ cursor: "pointer" }}> <ArrowRightIcon /></span>
                            </Form.Group>
                        </Form>
                        <hr />
                        {flips.length > 0 ?
                            <div id="flipper-scroll-list-wrapper">
                                <List
                                    ref={listRef}
                                    className="flipper-scroll-list"
                                    height={document.getElementById('maxHeightDummyFlip')?.offsetHeight}
                                    itemCount={flips.length}
                                    itemData={{ flips: flips }}
                                    itemSize={isSmall ? 300 : 330}
                                    layout="horizontal"
                                    width={document.getElementById('flipper-card-body')?.offsetWidth || 100}
                                >
                                    {getFlipForList}
                                </List>
                            </div>
                            : ""}
                    </div>
                </Card.Body>
                <Card.Footer>
                    This flipper is work in progress (open beta). Anything you see here is subject to change. Please leave suggestions and opinions on our <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">discord</a>.
                    <hr />
                    {isLoggedIn ? "" : <span>These are flips that were previosly found (~5 min ago). Anyone can use these and there is no cap on estimated profit.
                        Keep in mind that these are delayed to protect our paying supporters.
                        If you want more recent flips purchase our <a target="_blank" rel="noreferrer" href="/premium">premium plan.</a></span>}
                </Card.Footer>
            </Card>
            {
                selectedAuctionUUID ?
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
                    </div> : ""
            }
            <div>
                <hr />
                <Card>
                    <Card.Header>
                        <Card.Title>Flipper summary</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className="flipper-summary-wrapper">
                            <Card className="flipper-summary-card">
                                <Card.Header>
                                    <Card.Title>
                                        You got:
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ul>
                                        <li>Total flips received: {numberWithThousandsSeperators(missedInfo.totalFlips)}</li>
                                        <li>Profit of copied flips: {numberWithThousandsSeperators(missedInfo.estimatedProfitCopiedAuctions)} Coins</li>
                                    </ul>
                                </Card.Body>
                            </Card>
                            {
                                !isLoading && isLoggedIn && !hasPremium ?
                                    <Card className="flipper-summary-card">
                                        <Card.Header>
                                            <Card.Title>
                                                You don't have Premium
                                            </Card.Title>
                                        </Card.Header>
                                        <Card.Body>
                                            <ul>
                                                <li>
                                                    <span style={{ marginRight: "10px" }}>Missed Profit: {numberWithThousandsSeperators(missedInfo.missedEstimatedProfit)} Coins</span>
                                                    <Tooltip type="hover" content={<HelpIcon />}
                                                        tooltipContent={<span>This is the sum of the field 'Estimated profit' of the flips that were already sold when you received them. It represents the extra coins you could earn if you purchased our premium plan</span>} />
                                                </li>
                                                <li>Missed Flips: {numberWithThousandsSeperators(missedInfo.missedFlipsCount)}</li>
                                            </ul>
                                        </Card.Body>
                                    </Card>
                                    : null
                            }
                            <Card style={{ flexGrow: 2 }} className="flipper-summary-card">

                                <Card.Header>
                                    {
                                        !isLoading && isLoggedIn && hasPremium ?
                                            <Card.Title>How to get extra premium time for free</Card.Title> :
                                            <Card.Title>How to get premium for free</Card.Title>
                                    }
                                </Card.Header>
                                <Card.Body>
                                    <p>Get free premium time by inviting other people to our website. For further information check out our <Link to="/ref">Referral-Program</Link>.</p>
                                    <p>Your Link to invite people: <span style={{ fontStyle: "italic", color: "skyblue" }}>{window.location.href.split("?")[0] + "?refId=" + refInfo?.refId}</span> <CopyButton copyValue={window.location.href.split("?")[0] + "?refId=" + refInfo?.refId} successMessage={<span>Copied Ref-Link</span>} /></p>
                                </Card.Body>
                            </Card>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            <hr />
            <Card>
                <Card.Header>
                    <Card.Title><h2>FAQ</h2></Card.Title>
                </Card.Header>
                <Card.Body>
                    <h3>How are profitable flips found?</h3>
                    <p>New flips are found by comparing every new auction with the sell price of already finished auctions of the same item with the same or similar modifiers (e.g. enchantments).</p>
                    <h3>What auctions are new auctions compared with?</h3>
                    <p>Reference auctions depend on the individual item, its modifiers, and how often it is sold.
                        The algorithm to determine which auctions can be used as reference is changing frequently.
                        <br />
                        You can see the auctions used for reference by clicking on the (?) next to <code>Estimated Profit</code></p>
                    <h3>How reliable is the flipper?</h3>
                    <p>Statistically very reliable. Still, some flips might not sell as fast as others or at all. If you encounter a flip that can not be sold, please post a link to it in the skyblock channel on our discord so we can improve the flipper further.</p>
                    <h3>Why is there a "premium" version?</h3>
                    <p>TLDR: Servercosts and compensation for development.<br />
                        To run the flipper and the auction explorer we have to pay for servers to run it on. While we work hard to keep the cost down they are currently up to about 90$ per month.
                        And will increase further the more auctions we save and the the more users are using the site.
                        Furthermore we collectively spent more than 1000 hours of our spare time developing it and would like to get a some compensation for our efforts.
                        The best case would be to develop this and similar projects full time if we could, but so far we are struggling to cover even just the server costs.
                    </p>
                    <h3>What can the free version do?</h3>
                    <p>The free version of the auction flipper can be used if you just got started with ah-flipping. It displays flips with a delay and has some features deactivated.
                        Other than that, there are no limitations. <b>No cap on profit</b>, no need to do anything. (although we would appreciate it, if you support us, either with feedback or money)
                        The more users we have the more feedback we can get and the better the flips will become.</p>
                    <h3>What do I get if I buy premium?</h3>
                    <p>You get flips as soon as they are found. That allows you to buy up the most profitable flips before anyone else. Furthermore you get more filter options.
                        Which allow yous to only see flips that you are actually interested in. For a full list see <a target="_blank" href="/premium" rel="noreferrer">the premium page</a></p>
                    <h3>What do these labels mean?</h3>
                    <h4>Cost</h4>
                    <p>Cost is the auction price that you would have to pay. </p>
                    <h4>Median Price</h4>
                    <p>Median Price is the median price for that item. Taking into account ultimate enchantments, price paid at dark auctions, Rarity and stars. (for now)</p>
                    <h4>Volume</h4>
                    <p>Volume is the number of auctions that were sold in a 24 hour window. It is capped at 60 to keep the flipper fast.</p>
                    <h4>Lowest bin</h4>
                    <p>The lowest bin gives you an indication how much this item type is worth. It displays the lowest price for a given item type and ignores modifiers. You can click it.</p>
                    <h3>Should I flip an item with low volume?</h3>
                    <p>If you have to ask this question, the answer probably no. Low volume items require some user expertise to determine if the item actually is a good flip or not. However since its sold so infrequently it may be a niche item that has a higher profit margin.</p>
                    <h3>I have another question/ Bug report</h3> Ask via <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">discord</a> or <a target="_blank" href="/feedback" rel="noreferrer">feedback site</a>
                </Card.Body>
            </Card>
            <div id="maxHeightDummyFlip" style={{ position: "absolute", top: -1000, padding: "20px", zIndex: -1 }}>
                <Flip flip={DEMO_FLIP} />
            </div>
            {basedOnDialog}
            {customizeFlipDialog}
            {flipContextMenu}
        </div >
    );
}

export default Flipper;
