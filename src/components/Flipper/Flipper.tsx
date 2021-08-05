import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/ApiHelper';
import './Flipper.css';
import { Card, Form, Badge, Modal } from 'react-bootstrap';
import { getStyleForTier, numberWithThousandsSeperators } from '../../utils/Formatter';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import FlipperFilter from './FlipperFilter/FlipperFilter';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { KeyboardTab as ArrowRightIcon, Delete as DeleteIcon, Help as HelpIcon, Settings as SettingsIcon } from '@material-ui/icons';
import FlipBased from './FlipBased/FlipBased';
import { CopyButton } from '../CopyButton/CopyButton';
import AuctionDetails from '../AuctionDetails/AuctionDetails';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { FixedSizeList as List } from 'react-window';
import { Link } from 'react-router-dom';
import Tooltip from '../Tooltip/Tooltip';

interface Flips {
    all: FlipAuction[],
    filtered: FlipAuction[]
}

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

function Flipper() {

    let [flips, setFlips] = useState<Flips>({ all: [], filtered: [] });
    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [flipperFilter, setFlipperFilter] = useState<FlipperFilter>();
    let [autoscroll, setAutoscroll] = useState(false);
    let [hasPremium, setHasPremium] = useState(false);
    let [enabledScroll, setEnabledScroll] = useState(false);
    let [selectedAuctionUUID, setSelectedAuctionUUID] = useState("");
    let [isLoading, setIsLoading] = useState(wasAlreadyLoggedInGoogle);
    let [refInfo, setRefInfo] = useState<RefInfo>();
    let [basedOnAuction, setBasedOnAuction] = useState<FlipAuction | null>(null);
    const listRef = useRef(null);

    const autoscrollRef = useRef(autoscroll);
    autoscrollRef.current = autoscroll;

    const filterRef = useRef(flipperFilter);
    filterRef.current = flipperFilter;

    const flipLookup = {};

    useEffect(() => {
        mounted = true;
        _setAutoScroll(true);
        api.subscribeFlips(onNewFlip, uuid => onAuctionSold(uuid));
        attachScrollEvent();

        return () => {
            mounted = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    let loadHasPremium = () => {
        let googleId = localStorage.getItem("googleId");
        api.hasPremium(googleId!).then(hasPremiumUntil => {
            if (hasPremiumUntil > new Date()) {
                setHasPremium(true);
                // subscribe to the premium flips
                api.subscribeFlips(onNewFlip, uuid => onAuctionSold(uuid));
            }
            setIsLoading(false);
        });
    }

    let onLogin = () => {
        setIsLoggedIn(true);
        setIsLoading(true);
        loadHasPremium();
        api.getRefInfo().then(refInfo => {
            setRefInfo(refInfo);
        })
    }

    let onArrowRightClick = () => {
        if (listRef && listRef.current) {
            (listRef!.current! as any).scrollToItem(flips?.filtered.length - 1);
        }
    }

    let _setAutoScroll = (value: boolean) => {
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
            return {
                all: [],
                filtered: []
            };
        });
    }

    function onAuctionSold(uuid: string) {
        if (!mounted) {
            return;
        }
        setFlips(flips => {
            let flip = flips.all.find(a => a.uuid === uuid);
            if (flip) {
                flip.sold = true;
                if (!isValidForFilter(flip)) {
                    flips.filtered = flips.filtered.filter(f => f.uuid !== flip!.uuid)
                }
            }
            return flips;
        })
    }

    function onNewFlip(newFlipAuction: FlipAuction) {

        if (flipLookup[newFlipAuction.uuid] || !mounted) {
            return;
        }
        flipLookup[newFlipAuction.uuid] = newFlipAuction;

        api.getItemImageUrl(newFlipAuction.item).then((url) => {

            let isValid = isValidForFilter(newFlipAuction);

            newFlipAuction.item.iconUrl = url;
            newFlipAuction.showLink = true;

            setFlips(flips => {
                return {
                    all: [...flips.all, newFlipAuction],
                    filtered: isValid ? [...flips.filtered, newFlipAuction] : flips.filtered
                }
            });

            missedInfo = {
                estimatedProfitCopiedAuctions: missedInfo.estimatedProfitCopiedAuctions,
                missedEstimatedProfit: newFlipAuction.sold ? missedInfo.missedEstimatedProfit + (newFlipAuction.median - newFlipAuction.cost) : missedInfo.missedEstimatedProfit,
                missedFlipsCount: newFlipAuction.sold ? missedInfo.missedFlipsCount + 1 : missedInfo.missedFlipsCount,
                totalFlips: missedInfo.totalFlips + 1
            }

            if (autoscrollRef.current && isValid) {
                let element = document.getElementsByClassName('flipper-scroll-list').length > 0 ? document.getElementsByClassName('flipper-scroll-list').item(0) : null;
                if (element) {
                    element.scrollBy({ left: 16000, behavior: 'smooth' })
                    attachScrollEvent(element);
                }
            }
        });
    }

    function onFilterChange(filter) {
        setFlipperFilter(filter);
        setTimeout(() => {
            let newFlips: Flips = {
                all: flips.all,
                filtered: []
            }

            newFlips.all.forEach(flip => {
                if (isValidForFilter(flip)) {
                    newFlips.filtered.push(flip);
                }
            })
            setFlips(newFlips);
            setTimeout(() => {
                if (listRef && listRef.current) {
                    (listRef!.current! as any).scrollToItem(newFlips?.filtered.length - 1);
                }
            })
        })
    }

    function onCopyFlip(flip: FlipAuction) {
        let currentMissedInfo = missedInfo;
        currentMissedInfo.estimatedProfitCopiedAuctions += flip.median - flip.cost;
        flip.isCopied = true;
        setFlips(flips)
    }

    function getLowestBinLink(itemTag: string) {
        return '/item/' + itemTag + '?range=active&itemFilter=eyJCaW4iOiJ0cnVlIn0%3D';
    }

    let getFlipForList = (listData) => {

        let { data, index, style } = listData;
        let { flips } = data;

        return (<div id="flip-container" className="cards-wrapper">
            {getFlipElement(flips[index], style)}
        </div>)
    };

    function isValidForFilter(flipAuction: FlipAuction) {

        let filter = filterRef.current;

        if (filter?.onlyBin === true && !flipAuction.bin) {
            return false;
        }
        if (filter?.minProfit !== undefined && filter?.minProfit >= (flipAuction.median - flipAuction.cost)) {
            return false;
        }
        if (filter?.maxCost !== undefined && filter?.maxCost < flipAuction.cost) {
            return false;
        }
        if (filter?.onlyUnsold === true && flipAuction.sold) {
            return false;
        }
        if (filter?.minVolume !== undefined) {
            return filter?.minVolume >= 0 ? filter?.minVolume <= flipAuction.volume : Math.abs(filter?.minVolume) >= flipAuction.volume;
        }
        return true;
    }

    let getFlipElement = (flipAuction: FlipAuction, style) => {
        return (
            <div className="card-wrapper" key={flipAuction.uuid} style={style}>
                <Card className="flip-auction-card" style={{ cursor: "pointer" }} onClick={() => { setSelectedAuctionUUID(flipAuction.uuid) }}>
                    <Card.Header style={{ padding: "10px" }}>
                        <div className="ellipse" style={{ width: flipAuction.bin && flipAuction.sold ? "60%" : "80%", float: "left" }}>
                            <img crossOrigin="anonymous" src={flipAuction.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                            <span style={getStyleForTier(flipAuction.item.tier)}>{flipAuction.item.name}</span>
                        </div>
                        {flipAuction.bin ? <Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge> : ""}
                        {flipAuction.sold ? <Badge style={{ marginLeft: "5px" }} variant="danger">SOLD</Badge> : ""}
                    </Card.Header>
                    <Card.Body style={{ padding: "10px" }}>
                        <p>
                            <span className="card-label">Cost: </span><br />
                            <b style={{ color: "red" }}>{numberWithThousandsSeperators(flipAuction.cost)} Coins</b>
                        </p>
                        <p>
                            <span className="card-label">Median price: </span><br />
                            <b>{numberWithThousandsSeperators(flipAuction.median)} Coins</b>
                        </p>
                        <p>
                            <span className="card-label">Estimated Profit: </span><br />
                            <b style={{ color: "lime" }}>
                                +{numberWithThousandsSeperators(flipAuction.median - flipAuction.cost)} Coins
                            </b>
                            <span style={{ float: "right" }}>
                                <span onClick={() => { setBasedOnAuction(flipAuction) }}><HelpIcon /></span>
                            </span>
                        </p>
                        <hr />
                        <p>
                            <span className="card-label">Lowest BIN: </span><br />
                            <a rel="noreferrer" target="_blank" href={getLowestBinLink(flipAuction.item.tag)}>
                                {numberWithThousandsSeperators(flipAuction.lowestBin)} Coins
                            </a>
                        </p>
                        <p>
                            <span className="card-label">Seller: </span><br />
                            <b>
                                {flipAuction.sellerName}
                            </b>
                        </p>
                        <hr />
                        <div className="flex">
                            <div className="flex-max">
                                <span className="card-label">Volume: </span>
                                {flipAuction.volume > 59 ? ">60" : "~" + Math.round(flipAuction.volume * 10) / 10} per day
                            </div>
                            <CopyButton forceIsCopied={flipAuction.isCopied} onCopy={() => { onCopyFlip(flipAuction) }} buttonWrapperClass="flip-auction-copy-button" successMessage={<p>Copied ingame link <br /><i>/viewauction {flipAuction.uuid}</i></p>} copyValue={"/viewauction " + flipAuction.uuid} />
                        </div>
                    </Card.Body>
                </Card>
            </div >
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

    return (
        <div className="flipper">
            <Card className="card">
                <Card.Header>
                    <Card.Title>
                        {isLoading ? getLoadingElement() : !isLoggedIn ?
                            <div>
                                <h2>Free auction house flipper preview - hypixel skyblock ah history</h2>
                                You need to be logged and have Premium to have all features unlocked.
                            </div> :
                            hasPremium ? "You have premium and receive profitable auctions in real time." : <span>
                                These auctions are delayed by 5 min. Please purchase <a target="_blank" rel="noreferrer" href="/premium">premium</a> if you want real time flips.
                            </span>
                        }
                        <br />
                        <GoogleSignIn onAfterLogin={onLogin} />
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <div id="flipper-card-body">
                        <FlipperFilter onChange={onFilterChange} isLoggedIn={isLoggedIn} isPremium={hasPremium} />
                        <hr />
                        <Form inline style={{ justifyContent: "space-evenly" }}>
                            <Form.Group>
                                <Form.Label htmlFor="autoScrollCheckbox" style={{ marginRight: "10px" }}>Auto-Scroll?</Form.Label>
                                <Form.Check inline id="autoScrollCheckbox" checked={autoscroll} onChange={(e) => { _setAutoScroll(e.target.checked) }} type="checkbox" />
                            </Form.Group>
                            <Form.Group>
                                <div style={{ display: "contents", cursor: "pointer", marginRight: "10px" }} onClick={clearFlips}>
                                    <Form.Label>Clear flips!</Form.Label>
                                    <DeleteIcon color="error" />
                                </div>
                            </Form.Group>
                            {
                                hasPremium ?
                                    <span>The flipper is stuck <Tooltip type="hover" content={<HelpIcon />} tooltipContent={<span>We get new auctions every 60 sec. from Hypixel. So you may have to wait a bit for a new ones to be found.</span>} /></span> : ""
                            }
                            <Form.Group onClick={onArrowRightClick}>
                                <Form.Label style={{ cursor: "pointer", marginRight: "10px" }}>To newest flip</Form.Label>
                                <span style={{ cursor: "pointer" }}> <ArrowRightIcon /></span>
                            </Form.Group>
                        </Form>
                        {
                            flips.filtered.length === 0 ?
                                <div>
                                    {getLoadingElement(<p>Waiting for new flips....</p>)}
                                </div> : ""
                        }
                        {flips.filtered.length > 0 ?
                            <List
                                ref={listRef}
                                className="flipper-scroll-list"
                                height={475}
                                itemCount={flips.filtered.length}
                                itemData={{ flips: flips.filtered }}
                                itemSize={330}
                                layout="horizontal"
                                width={document.getElementById('flipper-card-body')?.offsetWidth || 100}
                            >
                                {getFlipForList}
                            </List>
                            : ""}
                    </div>
                </Card.Body>
                <Card.Footer>
                    This flipper is work in progress (open beta). Anything you see here is subject to change. Please write us your opinion and suggestion on our <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">discord</a>.
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

            {
                !isLoading && isLoggedIn && !hasPremium ?
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
                                    <Card style={{ flexGrow: 2 }} className="flipper-summary-card">
                                        <Card.Header>
                                            <Card.Title>How to get premium for free</Card.Title>
                                        </Card.Header>
                                        <Card.Body>
                                            <p>Get free premium time by inviting other people to our website. For further information check out our <Link to="/ref">Referral-Program</Link>.</p>
                                            <p>Your Link to invite people: <span style={{ fontStyle: "italic", color: "skyblue" }}>{window.location.href.split("?")[0] + "?refId=" + refInfo?.refId}</span> <CopyButton copyValue={window.location.href.split("?")[0] + "?refId=" + refInfo?.refId} successMessage={<span>Copied Ref-Link</span>} /></p>
                                        </Card.Body>
                                    </Card>
                                </div>
                            </Card.Body>
                        </Card>
                    </div> : ""
            }

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
            {basedOnDialog}
        </div >
    );
}

export default Flipper;
