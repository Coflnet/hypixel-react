import React, { useEffect, useState } from 'react';
import { ListGroup } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../../api/ApiHelper';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { numberWithThousandsSeperators } from '../../utils/NumberFormatter';
import './BidList.css'

interface Props {
    playerUUID: string
}

function BidList(props: Props) {

    let [bids, setBids] = useState<ItemBid[]>([]);
    let [allBidsLoaded, setAllBidsLoaded] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        bids = [];
        setBids([]);
        loadNewBids();
    }, [props.playerUUID]);

    let loadNewBids = (): void => {
        api.getBids(props.playerUUID, 20, bids.length).then(newBids => {
            if (newBids.length < 20) {
                setAllBidsLoaded(true);
            }
            newBids.forEach(auction => {
                loadItemImage(auction.item.tag, auction.uuid, bids.concat(newBids));
            })
            setBids(bids.concat(newBids));
        })
    }

    let loadItemImage = (itemTag: string, bidUUID: string, bids: ItemBid[]): void => {
        api.getItemImageUrl(itemTag).then((iconUrl => {
            let updatedBids = bids.slice();
            let bid = updatedBids.find(b => b.uuid === bidUUID);
            if (bid) {
                if (iconUrl) {
                    bid.item.iconUrl = iconUrl;
                }
            }
            setBids(updatedBids);
        }));;
    }


    let getItemImageElement = (bid: ItemBid) => {
        return (
            bid.item.iconUrl ? <img className="bid-item-image" src={bid.item.iconUrl} alt="" height="48" width="48" /> : undefined
        )
    }

    let getCoinImage = () => {
        return (
            <img src="/Coin.png" height="35px" width="35px" alt="" />
        );
    }

    let bidsList = bids.map(bid => {
        return (
            <ListGroup.Item key={bid.uuid}>
                <h4>
                    {
                        getItemImageElement(bid)
                    }
                    {bid.item.name}
                </h4>
                <p>Highest Bid: {numberWithThousandsSeperators(bid.highestBid)} {getCoinImage()}</p>
                <p>Highest Own: {numberWithThousandsSeperators(bid.highestOwn)} {getCoinImage()}</p>
                <p>End of Auction: {bid.end.toLocaleTimeString() + " " + bid.end.toLocaleDateString()}</p>
            </ListGroup.Item>
        )
    });

    return (
        <div className="bid-list">
            <InfiniteScroll style={{ overflow: "hidden" }} dataLength={bids.length} next={loadNewBids} hasMore={!allBidsLoaded} loader={<div className="loadingBanner">{getLoadingElement()}</div>}>
                <ListGroup>
                    {bidsList}
                </ListGroup>
            </InfiniteScroll>
        </div>
    )
}

export default BidList;