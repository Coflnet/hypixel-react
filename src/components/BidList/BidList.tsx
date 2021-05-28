import React, { useEffect, useState } from 'react';
import { Badge, Button, ListGroup } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../../api/ApiHelper';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import './BidList.css'
import { useHistory } from "react-router-dom";
import SubscribeButton from '../SubscribeButton/SubscribeButton';
import { Link } from 'react-router-dom';

interface Props {
    playerUUID: string
}

interface ListState {
    bids: BidForList[],
    allBidsLoaded: boolean,
    yOffset: number,
    playerUUID: string
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

// States, to remember the positions in the list, after coming back
let listStates: ListState[] = [];

function BidList(props: Props) {

    let history = useHistory();
    let [bids, setBids] = useState<BidForList[]>([]);
    let [allBidsLoaded, setAllBidsLoaded] = useState(false);

    useEffect(() => {
        mounted = true;
    })

    useEffect(() => {
        let listState = getListState();
        if (listState !== undefined) {
            setBids(listState.bids);
            setAllBidsLoaded(listState.allBidsLoaded);
            setTimeout(() => {
                window.scrollTo({
                    left: 0,
                    top: listState!.yOffset,
                    behavior: "auto"
                })
            }, 100);
        } else {
            window.scrollTo(0, 0);
            setAllBidsLoaded(false);
            setBids([]);
            loadNewBids(true);
        }

        let unlisten = history.listen(onHistoryListen);

        return () => {
            mounted = false;
            unlisten();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.playerUUID]);

    let onHistoryListen = () => {
        let listState = getListState();
        if (listState) {
            listState.yOffset = window.pageYOffset;
        }
    }

    let loadNewBids = (reset?: boolean): void => {
        api.getBids(props.playerUUID, 20, reset ? 0 : bids.length).then(newBids => {

            if (!mounted) {
                return;
            }

            if (newBids.length < 20) {
                allBidsLoaded = true;
                setAllBidsLoaded(true);
            }

            bids = reset ? newBids : bids.concat(newBids);
            newBids.forEach(auction => {
                loadItemImage(auction.item, auction.uuid, bids);
            })
            setBids(bids);

            updateListState();
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
            bid.item.iconUrl ? <img crossOrigin="anonymous" className="bid-item-image" src={bid.item.iconUrl} alt="item icon" height="48" width="48" loading="lazy"/> : undefined
        )
    }

    let getCoinImage = () => {
        return (
            <img src="/Coin.png" height="35px" width="35px" alt="coin icon" loading="lazy"/>
        );
    }

    let updateListState = () => {
        let listState = getListState();
        if (listState) {
            listState.allBidsLoaded = allBidsLoaded;
            listState.bids = bids;
        } else {
            listStates.push({
                bids: bids,
                playerUUID: props.playerUUID,
                yOffset: window.pageYOffset,
                allBidsLoaded: allBidsLoaded
            })
        }
    }

    let getListState = (): ListState | undefined => {
        return listStates.find(state => {
            return state.playerUUID === props.playerUUID;
        })
    }

    let upIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-double-up" viewBox="0 0 16 16">
            <path d="M7.646 2.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 3.707 2.354 9.354a.5.5 0 1 1-.708-.708l6-6z" />
            <path d="M7.646 6.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 7.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" />
        </svg>
    );

    let bidsList = bids.map(bid => {
        return (
            <Link key={bid.uuid} to={`/auction/${bid.uuid}`}>
                <ListGroup.Item action>
                    <h4>
                        {
                            getItemImageElement(bid)
                        }
                        {bid.item.name}
                        {bid.bin ? <Badge variant="success" style={{ marginLeft: "5px" }}>BIN</Badge> : ""}
                    </h4>
                    <p>Highest Bid: {numberWithThousandsSeperators(bid.highestBid)} {getCoinImage()}</p>
                    <p>Highest Own: {numberWithThousandsSeperators(bid.highestOwn)} {getCoinImage()}</p>
                    <p>End of Auction: {bid.end.toLocaleTimeString() + " " + bid.end.toLocaleDateString()}</p>
                </ListGroup.Item>
            </Link>
        )
    });

    return (
        <div className="bid-list">
            {bids.length === 0 && allBidsLoaded ?
                <div className="noAuctionFound"><img src="/Barrier.png" width="24" height="24" alt="not found icon" style={{ float: "left", marginRight: "5px" }} loading="lazy"/> <p>No bids found</p></div> :
                <InfiniteScroll style={{ overflow: "hidden" }} dataLength={bids.length} next={loadNewBids} hasMore={!allBidsLoaded} loader={<div className="loadingBanner">{getLoadingElement()}</div>}>
                    <ListGroup>
                        {bidsList}
                    </ListGroup>
                </InfiniteScroll>
            }
            <div className="fixed-bottom">
                <div className="btn-bottom"><Button type="primary" className="up-button" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }) }}>{upIcon}</Button></div>
                <div className="btn-bottom"><SubscribeButton type="player" topic={props.playerUUID} /></div>
            </div >
        </div>
    )
}

export default BidList;