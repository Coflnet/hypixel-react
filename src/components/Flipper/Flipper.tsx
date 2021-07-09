import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/ApiHelper';
import './Flipper.css';
import { useForceUpdate } from '../../utils/Hooks';
import { Card, Form, Badge } from 'react-bootstrap';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import FlipperFilter from './FlipperFilter/FlipperFilter';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { KeyboardTab as ArrowRightIcon, Delete as DeleteIcon, Help as HelpIcon } from '@material-ui/icons';
import Tooltip from '../Tooltip/Tooltip';
import FlipBased from './FlipBased/FlipBased';
import { CopyButton } from '../CopyButton/CopyButton';

function Flipper() {

    let [latestAuctions, setLatestAuctions] = useState<FlipAuction[]>([]);
    let [flipAuctions, setFlipAuctions] = useState<FlipAuction[]>([]);
    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [flipperFilter, setFlipperFilter] = useState<FlipperFilter>();
    let [autoscroll, setAutoscroll] = useState(false);
    let [hasPremium, setHasPremium] = useState(false);

    const autoscrollRef = useRef(autoscroll);
    autoscrollRef.current = autoscroll;

    let forceUpdate = useForceUpdate();

    useEffect(() => {
        api.getFlips().then(flips => {

            flips.forEach(flip => {
                api.getItemImageUrl(flip.item).then(url => {
                    flip.item.iconUrl = url;
                    setFlipAuctions(flips);
                    forceUpdate();
                });
            })

            setFlipAuctions(flips);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    let loadHasPremium = () => {
        let googleId = localStorage.getItem("googleId");
        api.hasPremium(googleId!).then(hasPremiumUntil => {
            if (hasPremiumUntil) {
                setHasPremium(true);
            }
        });
    }

    let onLogin = () => {
        setIsLoggedIn(true);
        loadHasPremium();
        api.subscribeFlips(onNewFlip, uuid => onAuctionSold(uuid));
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

    function clearFlips() {
        setLatestAuctions(() => []);
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
        api.getItemImageUrl(newFipAuction.item).then((url) => {
            newFipAuction.item.iconUrl = url;
            newFipAuction.showLink = false;

            setLatestAuctions(flipAuctions => {
                return [...flipAuctions, newFipAuction];
            });
            if (autoscrollRef.current) {
                setTimeout(() => {
                    onArrowRightClick();
                }, 0)
            }

            // reload for link-update
            setTimeout(() => {
                newFipAuction.showLink = true;
                forceUpdate();
            }, 5000)
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
        return <div className="cards-wrapper">{
            auctions.filter(auction => {
                if (!isLatest) {
                    return true;
                }
                if (flipperFilter?.onlyBin && !auction.bin) {
                    return false;
                }
                if (flipperFilter?.minProfit && flipperFilter.minProfit >= (auction.median - auction.cost)) {
                    return false;
                }
                if (flipperFilter?.maxCost && flipperFilter.maxCost < auction.cost) {
                    return false;
                }
                if (flipperFilter?.onlyUnsold && auction.sold) {
                    return false;
                }
                return true;
            }).map((flipAuction) => {
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
                        {!isLoggedIn || !hasPremium ?
                            "You need to be logged and have Premium to get profitable Auctions in real time." :
                            "Latest profitable Auctions"
                        }
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    {isLoggedIn && hasPremium ?
                        <div>
                            <FlipperFilter onChange={(newFilter) => { setFlipperFilter(newFilter) }} />
                            <Form inline >
                                <Form.Group>
                                    <div>
                                        <Form.Label htmlFor="autoScrollCheckbox" style={{ float: "left", marginRight: "10px" }}>Auto-Scroll?</Form.Label>
                                        <Form.Check id="autoScrollCheckbox" onChange={(e) => { _setAutoScroll(e.target.checked) }} type="checkbox" />
                                    </div>
                                </Form.Group>
                                <Form.Group onClick={onArrowRightClick}>
                                    <Form.Label style={{ cursor: "pointer" }}>To newest:</Form.Label>
                                    <span style={{ cursor: "pointer" }}> <ArrowRightIcon /></span>
                                </Form.Group>
                                <Form.Group onClick={clearFlips}>
                                    <Form.Label style={{ cursor: "pointer" }}>Clear flips:</Form.Label>
                                    <span style={{ cursor: "pointer" }}><DeleteIcon color="error" /></span>
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
                        </div> : ""}
                    <GoogleSignIn onAfterLogin={onLogin} />
                </Card.Body>
                {isLoggedIn ?
                    <Card.Footer>
                        This flipper is work in progress (proof of concept/open alpha). Anything you see here is subject to change. Please write us your opinion and suggestion on our <a target="_blank" rel="noreferrer" href="https://discord.gg/Qm55WEkgu6">discord</a>.
                    </Card.Footer> : ""}
            </Card>

            <hr />
            <Card>
                <Card.Header>
                    <Card.Title>Preview</Card.Title>
                    <Card.Subtitle>(found ~5min ago)</Card.Subtitle>
                </Card.Header>
                <Card.Body>
                    {mapAuctionElements(flipAuctions, false)}
                </Card.Body>
                <Card.Footer>
                    These are flipps that were previosly found. Anyone can use these and there is no cap on estimated profit.
                    Keep in mind that these are delayed to protect our paying supporters.
                    If you want more recent flipps purchase our <a target="_blank" rel="noreferrer" href="/premium">premium plan.</a>
                </Card.Footer>
            </Card>
            <hr />
            <Card>
                <Card.Header>
                    <Card.Title>FAQ</Card.Title>
                </Card.Header>
                <Card.Body>
                    <h3>What do these labels mean?</h3>
                    <h4>Cost</h4>
                    <p>Cost is the auction price that you would have to pay. </p>
                    <h4>Median Price</h4>
                    <p>Median Price is the median price for that item. Taking into account ultimate enchantments, Rarity and stars. (for now)</p>
                    <h4>Volume</h4>
                    <p>Volume is the amount of auctions that were sold in a 24 hour window. It is capped at 60 to keep the flipper fast.</p>
                    <h3>I have another question</h3> Ask via <a target="_blank" rel="noreferrer" href="https://discord.gg/Qm55WEkgu6">discord</a> or <a target="_blank" href="/feedback" rel="noreferrer">feedback site</a>
                </Card.Body>
            </Card>
        </div >
    );
}

export default Flipper;
