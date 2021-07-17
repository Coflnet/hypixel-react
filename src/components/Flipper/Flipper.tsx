import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/ApiHelper';
import './Flipper.css';
import { Card, Form, Badge } from 'react-bootstrap';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import FlipperFilter from './FlipperFilter/FlipperFilter';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { KeyboardTab as ArrowRightIcon, Delete as DeleteIcon, Help as HelpIcon } from '@material-ui/icons';
import Tooltip from '../Tooltip/Tooltip';
import FlipBased from './FlipBased/FlipBased';
import { CopyButton } from '../CopyButton/CopyButton';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { Link } from 'react-router-dom';
import { getProperty } from '../../utils/PropertiesUtils';

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function Flipper() {

    let [latestAuctions, setLatestAuctions] = useState<FlipAuction[]>([]);
    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [flipperFilter, setFlipperFilter] = useState<FlipperFilter>();
    let [autoscroll, setAutoscroll] = useState(false);
    let [hasPremium, setHasPremium] = useState(false);
    let [enabledScroll, setEnabledScroll] = useState(false);
    let [isLoading, setIsLoading] = useState(wasAlreadyLoggedInGoogle);
    let [refInfo, setRefInfo] = useState<RefInfo>();

    const autoscrollRef = useRef(autoscroll);
    autoscrollRef.current = autoscroll;

    const flipLookup = {};

    useEffect(() => {
        _setAutoScroll(true);
        api.subscribeFlips(onNewFlip, uuid => onAuctionSold(uuid));
        attachScrollEvent();
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
        let element = document.getElementById("rightEndFlipsAnchor")
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }
    }

    let _setAutoScroll = (value: boolean) => {
        if (value === true) {
            onArrowRightClick();
        }
        autoscroll = value;
        setAutoscroll(value);
    }

    function attachScrollEvent(scrollContainer: HTMLElement | null = null) {
        if (enabledScroll)
            return;
        if (!scrollContainer)
            scrollContainer = document.getElementById("flip-container");
        if (scrollContainer) {
            scrollContainer.addEventListener("wheel", (evt) => {
                evt.preventDefault();
                scrollContainer!.scrollLeft += evt.deltaY;
            });
            setEnabledScroll(true);
            enabledScroll = true;
        }

    }

    function clearFlips() {
        setLatestAuctions(() => {
            setEnabledScroll(false);
            return [];
        });
    }

    function onAuctionSold(uuid: string) {
        setLatestAuctions(latestAuctions => {
            let latestAuction = latestAuctions.find(a => a.uuid === uuid);
            if (latestAuction) {
                latestAuction.sold = true;
            }
            return latestAuctions;
        })
    }

    function onNewFlip(newFipAuction: FlipAuction) {

        if (flipLookup[newFipAuction.uuid])
            return;
        flipLookup[newFipAuction.uuid] = newFipAuction;

        api.getItemImageUrl(newFipAuction.item).then((url) => {
            newFipAuction.item.iconUrl = url;
            newFipAuction.showLink = true;

            setLatestAuctions(latestAuctions => {
                if (latestAuctions.length > 1000) {
                    latestAuctions.shift();
                }
                return [...latestAuctions, newFipAuction];
            });
            if (autoscrollRef.current) {
                let element = document.getElementById("flip-container");
                if (element) {
                    element.scrollBy({ left: 1600, behavior: 'smooth' })
                    attachScrollEvent(element);
                }
            }
        });
    }

    let getFlipHeaderElement = function (flipAuction: FlipAuction): JSX.Element {
        return (
            <Card.Header style={{ padding: "10px" }}>
                <div className="ellipse" style={{ width: flipAuction.bin && flipAuction.sold ? "60%" : "80%", float: "left" }}>
                    <img crossOrigin="anonymous" src={flipAuction.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                    <span style={{ color: "lightgrey" }}>{flipAuction.item.name}</span>
                </div>
                {flipAuction.bin ? <Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge> : ""}
                {flipAuction.sold ? <Badge style={{ marginLeft: "5px" }} variant="danger">SOLD</Badge> : ""}
            </Card.Header>
        )
    }

    let mapAuctionElements = (auctions: FlipAuction[], isLatest: boolean) => {
        return <div id="flip-container" className="cards-wrapper">{
            auctions.map((flipAuction) => {
                if (!isLatest) {
                    return <div key={flipAuction.uuid} />;
                }
                if (flipperFilter?.onlyBin && !flipAuction.bin) {
                    return <div key={flipAuction.uuid} />;
                }
                if (flipperFilter?.minProfit && flipperFilter.minProfit >= (flipAuction.median - flipAuction.cost)) {
                    return <div key={flipAuction.uuid} />;
                }
                if (flipperFilter?.maxCost && flipperFilter.maxCost < flipAuction.cost) {
                    return <div key={flipAuction.uuid} />;
                }
                if (flipperFilter?.onlyUnsold && flipAuction.sold) {
                    return <div key={flipAuction.uuid} />;
                }
                return (
                    <div className="card-wrapper" key={flipAuction.uuid}>
                        <Card className="flip-auction-card">
                            {flipAuction.showLink ?
                                <a className="disable-link-style" href={"/auction/" + flipAuction.uuid} target="_blank" rel="noreferrer">
                                    {getFlipHeaderElement(flipAuction)}
                                </a> :
                                <Tooltip type="hover" content={getFlipHeaderElement(flipAuction)}
                                    tooltipContent={<span>The link will be available in a few seconds...</span>}
                                />
                            }
                            <Card.Body style={{ padding: "10px" }}>
                                <p>
                                    <span className="card-label">Cost: </span><br />
                                    <span style={{ color: "red" }}>{numberWithThousandsSeperators(flipAuction.cost)} Coins</span>
                                </p>
                                <p>
                                    <span className="card-label">Median price: </span><br />
                                    <span>{numberWithThousandsSeperators(flipAuction.median)} Coins</span>
                                </p>
                                <span className="card-label">Estimated Profit: </span><br />
                                <span style={{ color: "green" }}>
                                    +{numberWithThousandsSeperators(flipAuction.median - flipAuction.cost)} Coins
                                </span>
                                <div style={{ float: "right" }}>
                                    <Tooltip tooltipTitle={<span>Auctions used for calculating the median price</span>} size="xl" type="click" content={<HelpIcon />}
                                        tooltipContent={<FlipBased flip={flipAuction} />}
                                    />
                                </div>
                                <hr style={{ marginTop: 0 }} />
                                <div className="flex">
                                    <div className="flex-max">
                                        <span className="card-label">Volume: </span>
                                        {flipAuction.volume > 59 ? ">60" : "~" + Math.round(flipAuction.volume * 10) / 10} per day
                                    </div>
                                    <CopyButton buttonWrapperClass="flip-auction-copy-button" successMessage={<p>Copied ingame link <br /><i>/viewauction {flipAuction.uuid}</i></p>} copyValue={"/viewauction " + flipAuction.uuid} />
                                </div>
                            </Card.Body>
                        </Card>
                    </div >
                )
            })
        }
            {isLatest ? <div id="rightEndFlipsAnchor" /> : ""}
        </div >;
    };

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
                        <br/>
                        <GoogleSignIn onAfterLogin={onLogin} />
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <div>
                        <FlipperFilter onChange={(newFilter) => { setFlipperFilter(newFilter) }} isLoggedIn={isLoggedIn} isPremium={hasPremium} />
                        <Form inline >
                            <Form.Group>
                                <div>
                                    <Form.Label htmlFor="autoScrollCheckbox" style={{ float: "left", marginRight: "10px" }}>Auto-Scroll?</Form.Label>
                                    <Form.Check id="autoScrollCheckbox" checked={autoscroll} onChange={(e) => { _setAutoScroll(e.target.checked) }} type="checkbox" />
                                </div>
                            </Form.Group>
                            <Form.Group onClick={onArrowRightClick}>
                                <Form.Label style={{ cursor: "pointer" }}>To newest:</Form.Label>
                                <span style={{ cursor: "pointer" }}> <ArrowRightIcon /></span>
                            </Form.Group>
                            <Form.Group>
                                <span onClick={clearFlips}>
                                    <Form.Label style={{ cursor: "pointer" }}>Clear flips:</Form.Label>
                                    <span style={{ cursor: "pointer" }}><DeleteIcon color="error" /></span>
                                </span>
                            </Form.Group>
                        </Form>
                        <hr />
                        {
                            latestAuctions.length === 0 ?
                                <div>
                                    {getLoadingElement(<p>Waiting for new flips....</p>)}
                                </div> : ""
                        }
                        {latestAuctions.length > 0 ?
                            <div className="premium" style={{ position: "relative" }}>
                                {mapAuctionElements(latestAuctions, true)}
                            </div> : ""}
                    </div>
                </Card.Body>
                <Card.Footer>
                    This flipper is work in progress (proof of concept/open alpha). Anything you see here is subject to change. Please write us your opinion and suggestion on our <a target="_blank" rel="noreferrer" href="https://discord.gg/Qm55WEkgu6">discord</a>.
                    <hr />
                    {isLoggedIn ? "" : <span>These are flipps that were previosly found (~5 min ago). Anyone can use these and there is no cap on estimated profit.
                        Keep in mind that these are delayed to protect our paying supporters.
                        If you want more recent flipps purchase our <a target="_blank" rel="noreferrer" href="/premium">premium plan.</a></span>}
                </Card.Footer>
            </Card>

            {isLoggedIn && refInfo ?
                <div>
                    <hr />

                    <Card className="card">
                        <Card.Header>
                            <Card.Title>How to get premium for free</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            Get free premium time by inviting other people to our website. For further information check out our <Link to="/ref">Referral-Program</Link>.<br />
                            Your Link to invite people: <span style={{ fontStyle: "italic", color: "skyblue" }}>{getProperty("refLink") + "?refId=" + refInfo?.refId}</span> <CopyButton copyValue={getProperty("refLink") + "?refId=" + refInfo?.refId} successMessage={<span>Copied Ref-Link</span>} />
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
                    <h3>How are profitable flipps found</h3>
                    <p>New flipps are found by comparing every new auction with the sell price of already finished auctions of the same item with the same or similar modifiers (e.g. enchantments). </p>
                    <h3>What auctions are new auctions comapred with</h3>
                    <p>Reference auctions depend on the induvidual item, its modifiers and how often it is sold.
                        The algorythim to determine which auctions can be used as refernce is changing frquently.
                        <br />
                        You can see the auctions used as reference by clicking on the (?) next to <code>Estimaded Profit</code></p>
                    <h3>How reliable is the flipper</h3>
                    <p>Statistically very reliable. Still some flips might not sell as fast as others or at all. If you encounter a flip that can't be sold please post a link to it in the skyblock channel on our discord so we can improve the flipper further.</p>
                    <h3>What can the free version do</h3>
                    <p>The free version of the auction flipper can be used if you just got started with ah flipping. It displays flipps with a delay and has some features deactivated.
                        Other than that there are no limitations. <b>No cap on profit</b>, no need to do anything. (although we would appreciate if you support us either with feedback or money)
                        The more users we have the more feedback we can get and the better the flips can become.</p>
                    <h3>What do I get if I buy premium</h3>
                    <p>You get flips as soon as they are found. That allows you to scope up the most profitable flips before any one else. Furthermore you get more filter options. Which allow you to only see flips that you are actually interested in. For a full list see <a target="_blank" href="/premium" rel="noreferrer">the premium page</a></p>
                    <h3>What do these labels mean?</h3>
                    <h4>Cost</h4>
                    <p>Cost is the auction price that you would have to pay. </p>
                    <h4>Median Price</h4>
                    <p>Median Price is the median price for that item. Taking into account ultimate enchantments, Rarity and stars. (for now)</p>
                    <h4>Volume</h4>
                    <p>Volume is the amount of auctions that were sold in a 24 hour window. It is capped at 60 to keep the flipper fast.</p>
                    <h3>Should I flip an item with low volume</h3>
                    <p>If you have to ask this question, the answer probably no. Low volume items require some user expertise to determine if the item actually is a good flip or not. However since its sold so infrequently it may be a niche item that has a higher profit margin.</p>
                    <h3>I have another question/ Bug report</h3> Ask via <a target="_blank" rel="noreferrer" href="https://discord.gg/Qm55WEkgu6">discord</a> or <a target="_blank" href="/feedback" rel="noreferrer">feedback site</a>
                </Card.Body>
            </Card>
        </div >
    );
}

export default Flipper;
