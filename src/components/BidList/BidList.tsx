import React, { useEffect, useState } from 'react';
import { Badge, ListGroup } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../../api/ApiHelper';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import './BidList.css'
import { useHistory } from "react-router-dom";

interface Props {
    playerUUID: string
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function BidList(props: Props) {

    let history = useHistory();
    let [bids, setBids] = useState<BidForList[]>([]);
    let [allBidsLoaded, setAllBidsLoaded] = useState(false);

    useEffect(() => {
        mounted = true;
    })

    useEffect(() => {
        setAllBidsLoaded(false);
        setBids([]);
        loadNewBids(true);

        return () => { mounted = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.playerUUID]);

    let loadNewBids = (reset?: boolean): void => {
        api.getBids(props.playerUUID, 20, reset ? 0 : bids.length).then(newBids => {

            if (!mounted) {
                return;
            }

            if (newBids.length < 20) {
                setAllBidsLoaded(true);
            }

            bids = reset ? newBids : bids.concat(newBids);
            newBids.forEach(auction => {
                loadItemImage(auction.item, auction.uuid, bids);
            })
            setBids(bids);
        })
    }

    let loadItemImage = (item: Item, bidUUID: string, bids: BidForList[]): void => {
        api.getItemImageUrl(item).then((iconUrl => {
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


    let getItemImageElement = (bid: BidForList) => {
        return (
            bid.item.iconUrl ? <img className="bid-item-image" src={bid.item.iconUrl} alt="" height="48" width="48" /> : undefined
        )
    }

    let getCoinImage = () => {
        return (
            <img src="/Coin.png" height="35px" width="35px" alt="" />
        );
    }

    let onBidClick = (bid: BidForList) => {
        history.push({
            pathname: `/auction/${bid.uuid}`
        })
    }

    let bidsList = bids.map(bid => {
        return (
            <ListGroup.Item key={bid.uuid} action onClick={() => { onBidClick(bid) }}>
                <h4>
                    {
                        getItemImageElement(bid)
                    }
                    {bid.item.name}
                    {bid.bin ? <Badge variant="secondary" style={{marginLeft: "5px"}}>BIN</Badge> : ""}
                </h4>
                <p>Highest Bid: {numberWithThousandsSeperators(bid.highestBid)} {getCoinImage()}</p>
                <p>Highest Own: {numberWithThousandsSeperators(bid.highestOwn)} {getCoinImage()}</p>
                <p>End of Auction: {bid.end.toLocaleTimeString() + " " + bid.end.toLocaleDateString()}</p>
            </ListGroup.Item>
        )
    });

    return (
        <div className="bid-list">
            {bids.length === 0 && allBidsLoaded ?
                <div className="noAuctionFound"><img src="/Barrier.png" width="24" height="24" alt="" style={{ float: "left", marginRight: "5px" }} /> <p>No bids found</p></div> :
                <InfiniteScroll style={{ overflow: "hidden" }} dataLength={bids.length} next={loadNewBids} hasMore={!allBidsLoaded} loader={<div className="loadingBanner">{getLoadingElement()}</div>}>
                    <ListGroup>
                        {bidsList}
                    </ListGroup>
                </InfiniteScroll>}
        </div>
    )
}

export default BidList;