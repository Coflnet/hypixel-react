import React, { useEffect, useState } from 'react';
import { Badge, ListGroup } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../../api/ApiHelper';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import './AuctionList.css';
import { useHistory } from "react-router-dom";
import { useForceUpdate } from '../../utils/Hooks';

interface Props {
    playerUUID: string
}

function AuctionList(props: Props) {

    let history = useHistory();
    let forceUpdate = useForceUpdate();

    let [auctions, setAuctions] = useState<Auction[]>([]);
    let [allAuctionsLoaded, setAllAuctinosLoaded] = useState(false);

    useEffect(() => {
        setAllAuctinosLoaded(false);
        setAuctions([]);
        loadNewAuctions(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.playerUUID]);

    let loadNewAuctions = (reset?: boolean): void => {
        api.getAuctions(props.playerUUID, 20, reset ? 0 : auctions.length).then(newAuctions => {

            if (newAuctions.length < 20) {
                setAllAuctinosLoaded(true);
            }

            auctions = reset ? newAuctions : auctions.concat(newAuctions);

            newAuctions.forEach(auction => {
                loadItemImage(auction.item, auction.uuid, auctions);
            })
            setAuctions(auctions);
        })
    }

    let loadItemImage = (item: Item, auctionUUID: string, auctions: Auction[]): void => {
        api.getItemImageUrl(item).then((iconUrl => {
            let updatedAuctions = auctions.slice();
            let auction = updatedAuctions.find(a => a.uuid === auctionUUID);
            if (auction) {
                auction.item.iconUrl = iconUrl;
            }
            setAuctions(updatedAuctions);
        }));;
    }

    let getCoinImage = () => {
        return (
            <img src="/Coin.png" height="35px" width="35px" alt="" />
        );
    }

    let getItemImageElement = (auction: Auction) => {
        return (
            auction.item.iconUrl ? <img className="auction-item-image" src={auction.item.iconUrl} alt="" height="48" width="48" onError={(error) => onImageLoadError(auction, error)} /> : undefined
        )
    }

    let onImageLoadError = (auction: Auction, data: any) => {
        api.getItemDetails(auction.item.tag || auction.item.name!).then((item) => {
            auction.item.iconUrl = item.iconUrl;
            setAuctions(auctions);
            forceUpdate();
        })
    }

    let onAuctionClick = (auction: Auction) => {
        history.push({
            pathname: `/auction/${auction.uuid}`
        })
    }

    let auctionList = auctions.map(auction => {
        return (
            <ListGroup.Item key={auction.uuid} action onClick={() => { onAuctionClick(auction) }}>
                <h4>
                    {
                        getItemImageElement(auction)
                    }
                    {auction.item.name}
                    {auction.end.getTime() < Date.now() ? <Badge variant="danger" style={{ marginLeft: "10px" }}>Ended</Badge> : <Badge variant="success" style={{ marginLeft: "10px" }}>Running</Badge>}
                </h4>
                <p>Highest Bid: {numberWithThousandsSeperators(auction.highestBid)} {getCoinImage()}</p>
                <p>Starting Bid: {numberWithThousandsSeperators(auction.startingBid)} {getCoinImage()}</p>
                <p>End of Auction: {auction.end.toLocaleTimeString() + " " + auction.end.toLocaleDateString()}</p>
            </ListGroup.Item>
        )
    });

    return (
        <div className="auction-list">
            {
                auctions.length === 0 && allAuctionsLoaded ?
                    <div className="noAuctionFound"><img src="/Barrier.png" width="24" height="24" alt="" style={{ float: "left", marginRight: "5px" }} /> <p>No auctions found</p></div> :
                    <InfiniteScroll style={{ overflow: "hidden" }} dataLength={auctions.length} next={loadNewAuctions} hasMore={!allAuctionsLoaded} loader={<div className="loadingBanner">{getLoadingElement()}</div>}>
                        <ListGroup>
                            {auctionList}
                        </ListGroup>
                    </InfiniteScroll>
            }
        </div>
    )
}

export default AuctionList