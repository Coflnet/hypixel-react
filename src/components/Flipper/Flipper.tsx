import React, { useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import './Flipper.css';
import { useForceUpdate } from '../../utils/Hooks';
import { Link } from 'react-router-dom';
import { Button, Card } from 'react-bootstrap';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { toast } from "react-toastify";

function Flipper() {

    let [latestAuctions, setLatestAuctions] = useState<FlipAuction[]>([]);
    let [flipAuctions, setFlipAuctions] = useState<FlipAuction[]>([]);
    let forceUpdate = useForceUpdate();

    useEffect(() => {

        api.getFlips().then(flips => {
            setFlipAuctions(flips);
            flipAuctions = flips;
            setTimeout(function () {
                subscribeToAuctions();
            });
        })

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
            }, 6000)
        });
    }

    let copyClick = (flipAuction: FlipAuction) => {
        flipAuction.isCopied = true;
        window.navigator.clipboard.writeText("/viewauction " + flipAuction.uuid);
        toast.success(<p>Copied ingame link <br /><i>/viewauction {flipAuction.uuid}</i></p>)
        forceUpdate()
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

    let mapAuctionElements = auctions => {
        return <div className="cards-wrapper">{
            auctions.map((flipAuction) => {
                return (
                    <div className="card-wrapper" key={flipAuction.uuid}>
                        <Card className="card" style={{ minHeight: "20vh" }}>
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
                                    <span className="card-label">Avg. Price: </span>
                                    <span>{numberWithThousandsSeperators(flipAuction.cost)} Coins</span>
                                </p>
                                <p>
                                    <span className="card-label">Sell price: </span>
                                    <span style={{ color: "red" }}>{numberWithThousandsSeperators(flipAuction.median)} Coins</span>
                                </p>
                                <p>
                                    <span className="card-label">Estimated Profit: </span>
                                    <span style={{ color: "green" }}>+{numberWithThousandsSeperators(flipAuction.median - flipAuction.cost)} Coins</span>
                                </p>
                                <br />
                                <hr style={{ marginTop: 0 }} />
                                <p>
                                    <span className="card-label">Volume: </span>
                                    {flipAuction.volume > 59 ? ">60" : "~" + Math.round(flipAuction.volume * 10) / 10} per day
                                </p>

                                {window.navigator.clipboard ? <div className="flip-auction-copy-button"><Button variant="secondary" onClick={() => { copyClick(flipAuction) }}>{flipAuction.isCopied ? copiedIcon : copyIcon}</Button></div> : ""}
                            </Card.Body>
                        </Card>
                    </div >
                )
            })
        }</div>;
    };

    return (
        <div className="flipper">
            {latestAuctions.length > 0 ?
                <div>

                    <h2>Latest profitable Auctions</h2>
                    {mapAuctionElements(latestAuctions)}
                </div> : ""}
            <hr />
            <h2>Profitable Auctions</h2>
            {mapAuctionElements(flipAuctions)}
        </div >
    );
}

export default Flipper;
