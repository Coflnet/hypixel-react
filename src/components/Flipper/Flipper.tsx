import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/ApiHelper';
import './Flipper.css';
import { useForceUpdate } from '../../utils/Hooks';
import { Link } from 'react-router-dom';
import { Button, Card, Form } from 'react-bootstrap';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { toast } from "react-toastify";
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import FlipperFilter from './FlipperFilter/FlipperFilter';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { KeyboardTab as ArrowRightIcon } from '@material-ui/icons'

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
            let promises: Promise<void>[] = [];
            flips.forEach(flip => {
                let promise = api.getItemImageUrl(flip.item).then(url => {
                    flip.item.iconUrl = url;
                });
                promises.push(promise);
            })

            Promise.all(promises).then(() => {
                setFlipAuctions(flips);
            })
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

    let subscribeToFlips = () => {
        api.subscribeFlips((newFipAuction: FlipAuction) => {
            api.getItemImageUrl(newFipAuction.item).then((url) => {
                newFipAuction.item.iconUrl = url;
                newFipAuction.showLink = false;

                let updatedLastestAuctions = [...latestAuctions, newFipAuction];
                setLatestAuctions(updatedLastestAuctions);
                latestAuctions = updatedLastestAuctions;

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
        });
    }

    let copyClick = (flipAuction: FlipAuction) => {
        flipAuction.isCopied = true;
        window.navigator.clipboard.writeText("/viewauction " + flipAuction.uuid);
        toast.success(<p>Copied ingame link <br /><i>/viewauction {flipAuction.uuid}</i></p>)
        forceUpdate()
    }

    let onLogin = () => {
        setIsLoggedIn(true);
        loadHasPremium();
        subscribeToFlips();
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

    let copyIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
        </svg>
    );

    let copiedIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard-check" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
        </svg>
    );

    let mapAuctionElements = (auctions: FlipAuction[], isLatest: boolean) => {
        return <div className="cards-wrapper">{
            auctions.filter(auction => {
                if (!isLatest) {
                    return true;
                }
                if (flipperFilter?.onyBin && !auction.bin) {
                    return false;
                }
                if (flipperFilter?.minProfit && flipperFilter.minProfit >= (auction.median - auction.cost)) {
                    return false;
                }
                return true;
            }).map((flipAuction) => {
                return (
                    <div className="card-wrapper" key={flipAuction.uuid}>
                        <Card className="card">
                            {flipAuction.showLink ?
                                <Card.Header>
                                    <a href={"/auction/" + flipAuction.uuid} target="_blank" rel="noreferrer">
                                        <img crossOrigin="anonymous" src={flipAuction.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                        <span>{flipAuction.item.name}</span>
                                    </a>
                                </Card.Header> :
                                <Card.Header style={{ padding: "10px" }}>
                                    <img crossOrigin="anonymous" src={flipAuction.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    <span>{flipAuction.item.name}</span>
                                </Card.Header>
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
                                <p>
                                    <span className="card-label">Estimated Profit: </span><br />
                                    <span style={{ color: "green" }}>+{numberWithThousandsSeperators(flipAuction.median - flipAuction.cost)} Coins</span>
                                </p>
                                <hr style={{ marginTop: 0 }} />
                                <div className="flex">
                                    <div className="flex-max">
                                        <span className="card-label">Volume: </span>
                                        {flipAuction.volume > 59 ? ">60" : "~" + Math.round(flipAuction.volume * 10) / 10} per day
                                    </div>

                                    <div>{window.navigator.clipboard ? <div className="flip-auction-copy-button"><Button variant="secondary" onClick={() => { copyClick(flipAuction) }}>{flipAuction.isCopied ? copiedIcon : copyIcon}</Button></div> : ""}</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div >
                )
            })
        }
            {isLatest ? <div id="rightEndFlipsAnchor" /> : ""}
        </div>;
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
                                <Form.Group>
                                    <Form.Label style={{ cursor: "pointer" }} onClick={onArrowRightClick}>To newest:</Form.Label>
                                    <span style={{ cursor: "pointer" }} onClick={onArrowRightClick}> <ArrowRightIcon /></span>
                                </Form.Group>
                            </Form>
                            <hr />
                            {
                                latestAuctions.length === 0 ?
                                    <div>
                                        {getLoadingElement(<p>Waiting for new flips....</p>)}
                                    </div> : ""
                            }
                        </div> : ""}
                    {latestAuctions.length > 0 && isLoggedIn ?
                        <div style={{ position: "relative" }}>
                            {mapAuctionElements(latestAuctions, true)}
                        </div> : ""}
                    <GoogleSignIn onAfterLogin={onLogin} />
                </Card.Body>
                {isLoggedIn ?
                    <Card.Footer>
                        This flipper is work in progress (proof of concept/open alpha). Anything you see here is subject to change. Please write us your opinion and suggestion on our <a className="text-link" href="https://discord.gg/Qm55WEkgu6">discord</a>.
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
                If you want more recent flipps purchase our <Link className="text-link" to="/premium">premium plan.</Link>
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
                    <h3>I have another question</h3> Ask via <a className="text-link" href="https://discord.gg/Qm55WEkgu6">discord</a> or <Link className="text-link" to="/feedback" >feedback site</Link>
                </Card.Body>
            </Card>
        </div >
    );
}

export default Flipper;
