/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown';
import api from '../../api/ApiHelper';
import './AuctionDetails.css';
import { Badge, Card, Collapse, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getStyleForTier, numberWithThousandsSeperators, convertTagToName } from '../../utils/Formatter';
import { getLoadingElement } from '../../utils/LoadingUtils';
import Search from '../Search/Search';
import { useHistory } from "react-router-dom";
import { useForceUpdate } from '../../utils/Hooks';
import moment from 'moment';
import { v4 as generateUUID } from 'uuid';
import { Link } from 'react-router-dom';

interface Props {
    auctionUUID: string
}

function AuctionDetails(props: Props) {

    let history = useHistory();
    let [auctionDetails, setAuctionDetails] = useState<AuctionDetails>();
    let [isItemDetailsCollapse, setIsItemDetailsCollapse] = useState(true);
    let [showNbtData, setShowNbtData] = useState(false);
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
                setAuctionDetails(auctionDetails);
            })
            api.getItemDetails(auctionDetails.auction.item.tag).then(item => {
                auctionDetails.auction.item.description = item.description;
                setAuctionDetails(auctionDetails);
            })
            api.getItemDetails(auctionDetails.auction.item.tag).then(item => {
                auctionDetails.auction.item = item;
                setAuctionDetails(auctionDetails);
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

    let isRunning = (auctionDetails: AuctionDetails) => {
        return auctionDetails.auction.end.getTime() >= Date.now() && !(auctionDetails.auction.bin && auctionDetails.bids.length > 0)
    }

    let setDocumentTitle = (auctionDetails: AuctionDetails) => {
        document.title = "Auction from " + auctionDetails.auctioneer.name + " for " + auctionDetails.auction.item.name;
    }

    let getTimeToolTipString = () => {


        if (!auctionDetails) {
            return "";
        }

        if (auctionDetails?.auction.bin && auctionDetails.auction.highestBid > 0 && auctionDetails.bids.length > 0) {
            return moment(auctionDetails.bids[0].timestamp).format('MMMM Do YYYY, h:mm:ss a')
        }
        return moment(auctionDetails.auction.end).format('MMMM Do YYYY, h:mm:ss a')
    }

    let onAucitonEnd = () => {
        forceUpdate();
    }

    let navigateToPlayer = (uuid) => {
        history.push({
            pathname: `/player/${uuid}`
        })
    }

    let checkIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
        </svg>
    );

    let XIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" className="bi bi-x-square-fill" viewBox="0 0 16 16">
            <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm3.354 4.646L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 1 1 .708-.708z" />
        </svg>
    );

    let arrowUpIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-up" viewBox="0 0 16 16">
            <path d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
        </svg>
    );

    let arrowDownIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-down" viewBox="0 0 16 16">
            <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
        </svg>
    );

    const labelBadgeVariant = "primary";
    const countBadgeVariant = "dark";

    let auctionCardContent = auctionDetails === undefined ? getLoadingElement() : (
        <div>
            <Card.Header>
                <Link to={"/item/" + auctionDetails.auction.item.tag}><h5>
                    <img crossOrigin="anonymous" src={auctionDetails?.auction.item.iconUrl} height="48" width="48" alt="" style={{ marginRight: "5px" }} />
                    <span style={getStyleForTier(auctionDetails.auction.item.tier)}>{auctionDetails?.auction.item.name}</span>
                    <Badge variant={countBadgeVariant} style={{ marginLeft: "5px" }}>x{auctionDetails?.count}</Badge>
                </h5>
                </Link>
                <OverlayTrigger
                    overlay={<Tooltip id={generateUUID()}>
                        {getTimeToolTipString()}
                    </Tooltip>}>
                    {
                        isRunning(auctionDetails) ?
                            <span>
                                End: {auctionDetails?.auction.end ? <Countdown date={auctionDetails.auction.end} onComplete={onAucitonEnd} /> : "-"}
                            </span> :
                            <span>
                                Auction ended {auctionDetails.auction.bin && auctionDetails.bids.length > 0 ? moment(auctionDetails.bids[0].timestamp).fromNow() : moment(auctionDetails.auction.end).fromNow()}
                            </span>
                    }
                </OverlayTrigger>
            </Card.Header>
            <Card.Body>
                <p>
                    <span className="label">
                        <Badge variant={labelBadgeVariant}>BIN:</Badge>
                    </span>
                    {
                        auctionDetails.auction.bin ?
                            checkIcon :
                            XIcon
                    }
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

    let itemDetailsCardContent = (auctionDetails === undefined ? getLoadingElement() :
        <div>
            <p>
                <span className="label">
                    <Badge variant={labelBadgeVariant}>Tier:</Badge>
                </span>
                <span style={getStyleForTier(auctionDetails.auction.item.tier)}>{auctionDetails?.auction.item.tier}</span>
            </p>
            <p>
                <span className="label">
                    <Badge variant={labelBadgeVariant}>Category:</Badge>
                </span> {convertTagToName(auctionDetails?.auction.item.category)}
            </p>
            <p>
                <span className="label">
                    <Badge variant={labelBadgeVariant}>NBT-Data:</Badge>
                </span>
                {showNbtData ?
                    <span>{JSON.stringify(auctionDetails.nbtData)}</span> :
                    <a href="#" onClick={() => { setShowNbtData(true) }}>Click to show</a>
                }
            </p>
            <p>
                <span className="label">
                    <Badge variant={labelBadgeVariant}>Description:</Badge>
                </span>
                <span style={{ float: "left" }} ref={(node) => { if (auctionDetails?.auction.item.description && node) { node.innerHTML = ""; node.append((auctionDetails.auction.item.description as any).replaceColorCodes()) } }}></span>
            </p>
        </div>
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
            <Card className="auction-card">
                {auctionCardContent}
            </Card>
            <Card className="auction-card">
                <Card.Header onClick={() => { setIsItemDetailsCollapse(!isItemDetailsCollapse) }} style={{ cursor: "pointer" }}>
                    <h5>
                        Item-Details
                        <span style={{ float: "right", marginRight: "10px" }}>{isItemDetailsCollapse ? arrowDownIcon : arrowUpIcon}</span>
                    </h5>
                </Card.Header>
                <Collapse in={!isItemDetailsCollapse}>
                    <Card.Body>
                        {itemDetailsCardContent}
                    </Card.Body>
                </Collapse>
            </Card>
            <Card className="auction-card">
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