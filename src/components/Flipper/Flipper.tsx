import React, { useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import './Flipper.css';
import { useForceUpdate } from '../../utils/Hooks';
import { Link } from 'react-router-dom';
import { Button, Card, Spinner } from 'react-bootstrap';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { toast } from "react-toastify";
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import FlipperFilter from './FlipperFilter/FlipperFilter';

function Flipper() {

    let [latestAuctions, setLatestAuctions] = useState<FlipAuction[]>([]);
    let [flipAuctions, setFlipAuctions] = useState<FlipAuction[]>([]);
    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [flipperFilter, setFlipperFilter] = useState<FlipperFilter>();
    let forceUpdate = useForceUpdate();

    useEffect(() => {

        api.getFlips().then(flips => {
            setFlipAuctions(flips);
            flipAuctions = flips;
        });
        subscribeToAuctions();
    }, [])

    let subscribeToAuctions = () => {
        api.subscribeFlips(function (newFipAuction: FlipAuction) {
            newFipAuction.showLink = false;

            let updatedLastestAuctions = [newFipAuction, ...latestAuctions];
            setLatestAuctions(updatedLastestAuctions);
            latestAuctions = updatedLastestAuctions;

            // reload for link-update
            setTimeout(() => {
                newFipAuction.showLink = true;
                forceUpdate();
            }, 5000)
        });

        setTimeout(() => {
            subscribeToAuctions();
        }, 30000)
    }

    let copyClick = (flipAuction: FlipAuction) => {
        flipAuction.isCopied = true;
        window.navigator.clipboard.writeText("/viewauction " + flipAuction.uuid);
        toast.success(<p>Copied ingame link <br /><i>/viewauction {flipAuction.uuid}</i></p>)
        forceUpdate()
    }

    let onLogin = () => {
        setIsLoggedIn(true);
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

    let mapAuctionElements = (auctions: FlipAuction[]) => {
        return <div className="cards-wrapper">{
            auctions.filter(auction => {
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
                                <Link to={`/auction/${flipAuction.uuid}`}>
                                    <Card.Header style={{ padding: "10px" }}>
                                        <span>{flipAuction.name}</span>
                                    </Card.Header>

                                </Link> :
                                <Card.Header style={{ padding: "10px" }}>
                                    <span>{flipAuction.name}</span>
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
        }</div>;
    };

    return (
        <div className="flipper">
            <Card className="card">
                <Card.Header>
                    <Card.Title>
                        {!isLoggedIn ?
                            "You need to be logged and have Premium to get profitable Auctions in real time." :
                            "Latest profitable Auctions"
                        }
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    {isLoggedIn ?
                        <div>
                            <FlipperFilter onChange={(newFilter) => { setFlipperFilter(newFilter) }} />
                            <hr />
                            {
                                latestAuctions.length === 0 ?
                                    <div>
                                        {<div style={{ textAlign: 'center' }}>
                                            <span><Spinner animation="grow" variant="primary"></Spinner>
                                                <Spinner animation="grow" variant="primary"></Spinner>
                                                <Spinner animation="grow" variant="primary"></Spinner></span>
                                            <p>Waiting for new flips....</p></div>}
                                    </div> : ""
                            }
                        </div> : ""}
                    {latestAuctions.length > 0 && isLoggedIn ?
                        <div style={{ position: "relative" }}>
                            {mapAuctionElements(latestAuctions)}
                        </div> : ""}
                    <GoogleSignIn onAfterLogin={onLogin} />
                </Card.Body>
                {isLoggedIn ?
                    <Card.Footer>
                        This flipper is work in progress (proof of concept/open alpha). Anything you see here is subject to change. Please write us your opinion and suggestion on our discord.
                </Card.Footer> : ""}
            </Card>

            <hr />
            <Card>
                <Card.Header>
                    <Card.Title>Preview</Card.Title>
                    <Card.Subtitle>(found ~5min ago)</Card.Subtitle>
                </Card.Header>
                <Card.Body>
                    {mapAuctionElements(flipAuctions)}
                </Card.Body>
                <Card.Footer>
                    These are flipps that were previosly found. Anyone can use these and there is no cap on estimated profit.
                    Keep in mind that these are delayed to protect our paying supporters.
                If you want more recent flipps purchase our <a href="/premium">premium plan.</a>
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
                    <h3>I have another question</h3> Ask via <a href="https://discord.gg/Qm55WEkgu6">discord</a> or <Link to="/feedback" >feedback site</Link>
                </Card.Body>
            </Card>
        </div >
    );
}

export default Flipper;
