/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import api from '../../api/ApiHelper';
import './AuctionDetails.css';
import { Badge, Button, Card, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getStyleForTier, numberWithThousandsSeperators, convertTagToName } from '../../utils/Formatter';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { useForceUpdate } from '../../utils/Hooks';
import moment from 'moment';
import { v4 as generateUUID } from 'uuid';
import { Link } from 'react-router-dom';
import SubscribeButton from '../SubscribeButton/SubscribeButton';
import { CopyButton } from '../CopyButton/CopyButton';
import { toast } from 'react-toastify';

interface Props {
    auctionUUID: string,
    retryCounter?: number
}

function AuctionDetails(props: Props) {

    let [isAuctionFound, setIsNoAuctionFound] = useState(false);
    let [auctionDetails, setAuctionDetails] = useState<AuctionDetails>();
    let forceUpdate = useForceUpdate();

    useEffect(() => {
        loadAuctionDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.auctionUUID]);

    let tryNumber = 1;
    let loadAuctionDetails = () => {

        api.getAuctionDetails(props.auctionUUID, tryNumber).then(auctionDetails => {
            auctionDetails.bids.sort((a, b) => b.amount - a.amount)
            setAuctionDetails(auctionDetails);
            api.getItemImageUrl(auctionDetails.auction.item).then(url => {
                auctionDetails.auction.item.iconUrl = url;
                setAuctionDetails(auctionDetails);
            })
            api.getItemDetails(auctionDetails.auction.item.tag).then(item => {
                auctionDetails.auction.item.description = item.description;
                if (!auctionDetails.auction.item.name) {
                    auctionDetails.auction.item.name = item.name;
                }
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
        }).catch((error) => {
            if (tryNumber < (props.retryCounter || 0)) {
                tryNumber++;
                setTimeout(() => {
                    loadAuctionDetails();
                }, 2000)
            } else {
                setIsNoAuctionFound(true);
                if (error) {
                    toast.error(error.Message);
                }
            }
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

    function getNBTElement(): JSX.Element {
        return (!auctionDetails?.nbtData ? <div /> : <div>
            {
                Object.keys(auctionDetails?.nbtData).map(key => {
                    let currentNBT = auctionDetails?.nbtData[key];
                    return (<div key={key}>
                        <p>
                            <span className="label">
                                <Badge variant={labelBadgeVariant}>{convertTagToName(key)}:</Badge>
                            </span>
                            {formatNBTValue(key, currentNBT)}
                        </p>
                    </div>)
                })
            }
        </div >)
    }

    function formatNBTValue(key: string, value: any) {
        let tagNbt = [
            "heldItem",
            "personal_compact_0",
            "personal_compact_1",
            "personal_compact_2",
            "personal_compact_3",
            "personal_compact_4",
            "personal_compact_5",
            "personal_compact_6",
            "personal_compact_7",
            "personal_compact_8",
            "personal_compact_9",
            "personal_compact_10",
            "personal_compact_11",
            "personal_compactor_0",
            "personal_compactor_1",
            "personal_compactor_2",
            "personal_compactor_3",
            "personal_compactor_4",
            "personal_compactor_5",
            "personal_compactor_6",
            "personal_deletor_0",
            "personal_deletor_1",
            "personal_deletor_2",
            "personal_deletor_3",
            "personal_deletor_4",
            "personal_deletor_5",
            "personal_deletor_6",
            "personal_deletor_7",
            "personal_deletor_8",
            "personal_deletor_9",
            "last_potion_ingredient",
            "power_ability_scroll",
            "skin"
        ];

        if (key === "rarity_upgrades") {
            if (value === "0") {
                return "false";
            }
            if (value === "1") {
                return "true";
            }
            return value;
        }

        if (!isNaN(value) && Number.isInteger(parseInt(value, 10))) {
            return numberWithThousandsSeperators(value);
        }

        let index = tagNbt.findIndex(tag => tag === key);
        if (index !== -1) {
            return <Link to={"/item/" + value}>{convertTagToName(value)}</Link>;
        }
        return value.toString();
    }

    const labelBadgeVariant = "primary";
    const binBadgeVariant = "success";
    const countBadgeVariant = "dark";

    let auctionCardContent = auctionDetails === undefined ? getLoadingElement() : (
        <div>
            <Card.Header className="auction-card-header">
                <Link to={"/item/" + auctionDetails.auction.item.tag}><h1>
                    <span className="item-icon">
                        <img crossOrigin="anonymous" src={auctionDetails?.auction.item.iconUrl} height="48" width="48" alt="item icon" style={{ marginRight: "5px" }} loading="lazy" />
                    </span>
                    <span>
                        <span style={getStyleForTier(auctionDetails.auction.item.tier)}>{auctionDetails?.auction.item.name}</span>
                        <Badge variant={countBadgeVariant} style={{ marginLeft: "5px" }}>x{auctionDetails?.count}</Badge>
                        {auctionDetails.auction.bin ? <Badge variant={binBadgeVariant} style={{ marginLeft: "5px" }}>BIN</Badge> : ""}
                    </span>
                </h1>
                </Link>
                <div className="auction-detail-card-head-subtext">
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
                    {isRunning(auctionDetails) ?
                        <div>
                            <SubscribeButton type="auction" topic={props.auctionUUID} hideText={document.body.clientWidth <= 480} />
                        </div>
                        : ""}
                    <CopyButton buttonVariant="primary" copyValue={"/viewauction " + props.auctionUUID} successMessage={<p>Copied ingame link <br /><i>/viewauction {props.auctionUUID}</i></p>} />
                </div>
            </Card.Header>
            <Card.Body>
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
                        <Badge variant={labelBadgeVariant}>Reforge:</Badge>
                    </span>
                    {auctionDetails?.reforge}
                </p>

                <Link to={`/player/${auctionDetails.auctioneer.uuid}`}>
                    <p>
                        <span className="label">
                            <Badge variant={labelBadgeVariant}>Auctioneer:</Badge>
                        </span>
                        {auctionDetails?.auctioneer.name}
                        <img crossOrigin="anonymous" className="player-head-icon" src={auctionDetails?.auctioneer.iconUrl} alt="auctioneer icon" height="16" width="16" style={{ marginLeft: "5px" }} loading="lazy" />
                    </p>
                </Link>

                <p>
                    <span className="label">
                        <Badge variant={labelBadgeVariant}>Created:</Badge>
                    </span>
                    {auctionDetails?.itemCreatedAt.toLocaleDateString() + " " + auctionDetails.itemCreatedAt.toLocaleTimeString()}
                </p>

                <div style={{ overflow: "auto" }}>
                    <span className={auctionDetails && auctionDetails!.enchantments.length > 0 ? "labelForList" : "label"}>
                        <Badge variant={labelBadgeVariant}>Enchantments:</Badge>
                    </span>
                    {auctionDetails && auctionDetails!.enchantments.length > 0 ?
                        (<ul className="list">
                            {auctionDetails?.enchantments.map(enchantment => {
                                let enchantmentString = <span>{enchantment.name}</span>;
                                if (enchantment.color) {
                                    enchantmentString = <span style={{ float: "left" }} ref={(node) => { if (node && enchantment.color) { node.innerHTML = ""; node.append(((enchantment.color + enchantment.name + " " + enchantment.level) as any).replaceColorCodes()) } }}></span>
                                }
                                return enchantment.name ? <li key={"enchantment-" + enchantment.name}>{enchantmentString}</li> : ""
                            })}
                        </ul>) :
                        <p>None</p>}
                </div>
                <div>
                    {
                        getNBTElement()
                    }
                </div>
            </Card.Body>
        </div >
    );

    let bidList = auctionDetails?.bids.length === 0 ? <p>No bids</p> :
        auctionDetails?.bids.map((bid, i) => {
            let headingStyle = i === 0 ? { color: "green" } : { color: "red" };
            return <Link key={generateUUID()} to={`/player/${bid.bidder.uuid}`}>
                <ListGroup.Item key={bid.amount} action>
                    <img crossOrigin="anonymous" className="player-head-icon" src={bid.bidder.iconUrl} height="64" width="64" alt="bidder minecraft icon" style={{ marginRight: "15px", float: "left" }} loading="lazy" />
                    <h6 style={headingStyle}>
                        {numberWithThousandsSeperators(bid.amount)} Coins
                    </h6>
                    <span>
                        {bid.bidder.name}
                    </span><br />
                    <span>{moment(bid.timestamp).fromNow()}</span>
                </ListGroup.Item>
            </Link>
        })

    return (
        <div className="auction-details">
            {isAuctionFound ?
                <div>
                    <p>The auction you tried to see doesn't seem to exist. Please go back.</p><br />
                    <Link to="/"><Button>Get back</Button></Link>
                </div> :
                <div>
                    <div>
                        <Card className="auction-card first-card">
                            {auctionCardContent}
                        </Card>
                        <Card className="auction-card">
                            <Card.Header>
                                <h2>Bids</h2>
                                {auctionDetails ? <h6>Starting bid:  {numberWithThousandsSeperators(auctionDetails?.auction.startingBid)} Coins</h6> : ""}
                            </Card.Header>
                            <Card.Body>
                                <ListGroup>
                                    {bidList || getLoadingElement()}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            }
        </div>
    )
}

export default AuctionDetails
