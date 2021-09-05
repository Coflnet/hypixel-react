import React, { useEffect, useState } from 'react';
import './FlipBased.css';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { numberWithThousandsSeperators } from '../../../utils/Formatter';
import api from '../../../api/ApiHelper';
import { getLoadingElement } from '../../../utils/LoadingUtils';
import { useForceUpdate } from '../../../utils/Hooks';

interface Props {
    flip: FlipAuction
}

function FlipBased(props: Props) {

    let [auctions, setAuctions] = useState<Auction[]>([])
    let [isLoading, setIsLoading] = useState(true);

    let forceUpdate = useForceUpdate();

    useEffect(() => {
        api.getFlipBasedAuctions(props.flip.uuid).then(auctions => {

            setAuctions(auctions.sort((a, b) => b.highestBid - a.highestBid));
            setIsLoading(false);
        })
    }, [props.flip.uuid])

    useEffect(() => {
        forceUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.flip.item.iconUrl, props.flip.item.name])

    let auctionsElement = auctions.map(auction => {
        return (
            <div className="card-wrapper" style={{ display: "inline-block" }} key={auction.uuid}>
                <Link className="disable-link-style" to={`/auction/${auction.uuid}`}>
                    <Card className="card">
                        <Card.Header style={{ padding: "10px" }}>
                            <p className="ellipsis" style={{ width: "180px" }}>
                                <img crossOrigin="anonymous" src={props.flip.item.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                {auction.item.name}
                            </p>
                        </Card.Header>
                        <Card.Body>
                            <div>
                                <ul>
                                    <li>Ended {moment(auction.end).fromNow()}</li>
                                    <li>{numberWithThousandsSeperators(auction.highestBid || auction.startingBid)} Coins</li>
                                    {auction.bin ? <li><Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge></li> : ""}
                                </ul>
                            </div>
                        </Card.Body>
                    </Card>
                </Link>
            </div>
        )
    })

    return (
        <div className="flip-based">
            {isLoading
                ? getLoadingElement() :
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "stretch" }}>
                    {auctionsElement}
                </div>}
        </div>
    );
}

export default FlipBased;