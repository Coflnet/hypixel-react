import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import api from '../../api/ApiHelper';
import './AuctionDetails.css';
import { Badge, Card, ListGroup } from 'react-bootstrap';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { getLoadingElement } from '../../utils/LoadingUtils';
import Search from '../Search/Search';
import { useHistory } from "react-router-dom";
import { useForceUpdate } from '../../utils/Hooks';

interface Props {
    auctionUUID: string
}

function AuctionDetails(props: Props) {

    let history = useHistory();
    let [auctionDetails, setAuctionDetails] = useState<AuctionDetails>();
    let forceUpdate = useForceUpdate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!auctionDetails) {
            loadAuctionDetails()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionDetails?.auction.item.iconUrl])

    let loadAuctionDetails = () => {
        api.getAuctionDetails(props.auctionUUID).then(auctionDetails => {
            auctionDetails.bids.sort((a, b) => b.amount - a.amount)
            setAuctionDetails(auctionDetails);
            api.getItemImageUrl(auctionDetails.auction.item).then(url => {
                auctionDetails.auction.item.iconUrl = url;
                forceUpdate();
            })

            let namePromises: Promise<void>[] = [];
            auctionDetails.bids.forEach(bid => {
                let promise = api.getPlayerName(bid.bidder.uuid).then(name => {
                    bid.bidder.name = name;
                });
                namePromises.push(promise);
            })
            namePromises.push(api.getPlayerName(auctionDetails.auctioneer.uuid).then(name => {
                auctionDetails.auctioneer.name = name;
            }))
            Promise.all(namePromises).then(() => {
                setDocumentTitle(auctionDetails);
                forceUpdate();
            })
        })
    }

    let setDocumentTitle = (auctionDetails: AuctionDetails) => {
        document.title = "Auction from " + auctionDetails.auctioneer.name + " for " + auctionDetails.auction.item.name;
    }

    let onAucitonEnd = () => {
        forceUpdate();
    }

    let navigateToPlayer = (uuid) => {
        history.push({
            pathname: `/player/${uuid}`
        })
    }


    const labelBadgeVariant = "primary";
    const countBadgeVariant = "dark";

    let auctionCardContent = auctionDetails === undefined ? getLoadingElement() : (
        <div>
            <Card.Header>
                <h5>
                    <img crossOrigin="anonymous" src={auctionDetails?.auction.item.iconUrl} height="48" width="48" alt="" style={{ marginRight: "5px" }} />
                    {auctionDetails?.auction.item.name}
                    <Badge variant={countBadgeVariant} style={{ marginLeft: "5px" }}>x{auctionDetails?.count}</Badge>
                </h5>
                {
                    auctionDetails!.auction.end.getTime() >= Date.now() ?
                        <h6>
                            Ends in {auctionDetails?.auction.end ? <Countdown date={auctionDetails.auction.end} onComplete={onAucitonEnd} /> : ""}
                        </h6> :
                        <p>Auction alreay ended</p>
                }
            </Card.Header>
            <Card.Body>
                <p>
                    <span className="label">
                        <Badge variant={labelBadgeVariant}>Category:</Badge>
                    </span> {auctionDetails?.auction.item.category}
                </p>
                <p>
                    <span className="label">
                        <Badge variant={labelBadgeVariant}>Tier:</Badge>
                    </span>
                    {auctionDetails?.auction.item.tier}
                </p>
                <p>
                    <span className="label">
                        <Badge variant={labelBadgeVariant}>Reforge:</Badge>
                    </span>
                    {auctionDetails?.reforge}
                </p>
                <p style={{ cursor: "pointer" }} onClick={() => navigateToPlayer(auctionDetails?.auctioneer.uuid)}>
                    <span className="label">
                        <Badge variant={labelBadgeVariant}>Auctioneer:</Badge>
                    </span>
                    {auctionDetails?.auctioneer.name}
                    <img crossOrigin="anonymous" src={auctionDetails?.auctioneer.iconUrl} alt="" height="16" width="16" style={{ marginLeft: "5px" }} />
                </p>
                <div>
                    <span className={auctionDetails && auctionDetails!.enchantments.length > 0 ? "labelForList" : "label"}>
                        <Badge variant={labelBadgeVariant}>Enchantments:</Badge>
                    </span>
                    <div>
                        {auctionDetails && auctionDetails!.enchantments.length > 0 ?
                            (<ul>
                                {auctionDetails?.enchantments.map(enchantment => {
                                    return <li key={enchantment.id}>{enchantment.name} {enchantment.level}</li>
                                })}
                            </ul>) :
                            <p>None</p>}
                    </div>
                </div>
            </Card.Body>
        </div >
    );

    let bidList = auctionDetails?.bids.length === 0 ? <p>No bids</p> :
        auctionDetails?.bids.map((bid, i) => {
            let headingStyle = i === 0 ? { color: "green" } : { color: "red" };
            return <ListGroup.Item key={bid.amount} action onClick={() => navigateToPlayer(bid.bidder.uuid)}>
                <h6 style={headingStyle}>
                    {numberWithThousandsSeperators(bid.amount)} Coins
                </h6>
                <span>
                    <img crossOrigin="anonymous" src={bid.bidder.iconUrl} height="32" width="32" alt="" style={{ marginRight: "5px" }} />
                    {bid.bidder.name}
                </span>
            </ListGroup.Item>
        })

    return (
        <div className="auction-details">
            <Search />
            <Card className="auctionCard">
                {auctionCardContent}
            </Card>
            <Card className="auctionCard">
                <Card.Header>
                    <h5>Bids</h5>
                    {auctionDetails && auctionDetails?.bids.length > 1 ? <h6>Starting bid:  {numberWithThousandsSeperators(auctionDetails?.auction.startingBid)} Coins</h6> : ""}
                </Card.Header>
                <Card.Body>
                    <ListGroup>
                        {bidList || getLoadingElement()}
                    </ListGroup>
                </Card.Body>
            </Card>
        </div>
    )
}

export default AuctionDetails