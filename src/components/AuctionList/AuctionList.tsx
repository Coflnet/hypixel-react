import React, { useEffect, useState } from 'react';
import { ListGroup, Spinner } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../../api/ApiHelper';
import { numberWithThousandsSeperators } from '../../utils/NumberFormatter';
import './AuctionList.css';

interface Props {
    playerUUID: string
}

function AuctionList(props: Props) {

    let [auctions, setAuctions] = useState<Auction[]>([]);
    let [allAuctionsLoaded, setAllAuctinosLoaded] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        auctions = [];
        setAuctions([]);
        loadNewAuctions();
    }, [props.playerUUID]);

    let loadNewAuctions = (): void => {
        api.getAuctions(props.playerUUID, 20, auctions.length).then(newAuctions => {
            if (newAuctions.length === 0) {
                setAllAuctinosLoaded(true);
            }
            newAuctions.forEach(auction => {
                loadItemImage(auction.item.name, auction.uuid, auctions.concat(newAuctions));
            })
            setAuctions(auctions.concat(newAuctions));
        })
    }

    let loadItemImage = (itemName: string, auctionUUID: string, auctions: Auction[]): void => {
        api.getItemDetails(itemName).then((item => {
            let updatedAuctions = auctions.slice();
            let auction = updatedAuctions.find(a => a.uuid === auctionUUID);
            if (auction) {
                if (item.name) {
                    auction.item = item;
                }
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
            auction.item.iconUrl ? <img className="auction-item-image" src={auction.item.iconUrl} alt="" /> : undefined
        )
    }

    let auctionList = auctions.map(auction => {
        return (
            <ListGroup.Item key={auction.uuid}>
                <h4>
                    {
                        getItemImageElement(auction)
                    }
                    {auction.item.name}
                </h4>
                <p>Highest Bid: {numberWithThousandsSeperators(auction.highestBid)} {getCoinImage()}</p>
                <p>End of Auction: {auction.end.toLocaleTimeString() + " " + auction.end.toLocaleDateString()}</p>
            </ListGroup.Item>
        )
    });

    return (
        <div className="auction-list">
            <InfiniteScroll style={{overflow: "hidden"}} dataLength={auctions.length} next={loadNewAuctions} hasMore={!allAuctionsLoaded} loader={<Spinner animation="border" role="status" variant="primary" />}>
                <ListGroup>
                    {auctionList}
                </ListGroup>
            </InfiniteScroll>
        </div>
    )
}

export default AuctionList