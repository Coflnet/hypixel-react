import React, { useEffect, useState } from 'react';
import { Badge, Button, ListGroup } from 'react-bootstrap';
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

interface ListState {
    auctions: Auction[],
    allAuctionsLoaded: boolean,
    yOffset: number,
    playerUUID: string
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

// States, to remember the positions in the list, after coming back
let listStates: ListState[] = [];

function AuctionList(props: Props) {

    let history = useHistory();
    let forceUpdate = useForceUpdate();

    let [auctions, setAuctions] = useState<Auction[]>([]);
    let [allAuctionsLoaded, setAllAuctinosLoaded] = useState(false);

    useEffect(() => {
        mounted = true;
    })

    useEffect(() => {

        let listState = getListState();
        if (listState !== undefined) {
            setAuctions(listState.auctions);
            setAllAuctinosLoaded(listState.allAuctionsLoaded);
            setTimeout(() => {
                window.scrollTo({
                    left: 0,
                    top: listState!.yOffset,
                    behavior: "auto"
                })
            }, 100);
        } else {
            window.scrollTo(0, 0);
            setAllAuctinosLoaded(false);
            setAuctions([]);
            loadNewAuctions(true);
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

    let loadNewAuctions = (reset?: boolean): void => {
        api.getAuctions(props.playerUUID, 20, reset ? 0 : auctions.length).then(newAuctions => {

            if (!mounted) {
                return;
            }

            if (newAuctions.length < 20) {
                allAuctionsLoaded = true;
                setAllAuctinosLoaded(true);
            }

            auctions = reset ? newAuctions : auctions.concat(newAuctions);

            newAuctions.forEach(auction => {
                loadItemImage(auction.item, auction.uuid, auctions);
            })
            setAuctions(auctions);

            updateListState();
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
            auction.item.iconUrl ? <img crossOrigin="anonymous" className="auction-item-image" src={auction.item.iconUrl} alt="" height="48" width="48" onError={(error) => onImageLoadError(auction, error)} /> : undefined
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

    let updateListState = () => {
        let listState = getListState();
        if (listState) {
            listState.allAuctionsLoaded = allAuctionsLoaded;
            listState.auctions = auctions;
        } else {
            listStates.push({
                auctions: auctions,
                playerUUID: props.playerUUID,
                yOffset: window.pageYOffset,
                allAuctionsLoaded: allAuctionsLoaded
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

    let auctionList = auctions.map(auction => {
        return (
            <ListGroup.Item key={auction.uuid} action onClick={() => { onAuctionClick(auction) }}>
                <h4>
                    {
                        getItemImageElement(auction)
                    }
                    {auction.item.name}
                    {auction.end.getTime() < Date.now() || (auction.bin && auction.highestBid > 0) ? <Badge variant="danger" style={{ marginLeft: "10px" }}>Ended</Badge> : <Badge variant="info" style={{ marginLeft: "10px" }}>Running</Badge>}
                    {auction.bin ? <Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge> : ""}
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
            <Button className="upButton" type="primary" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }) }}>{upIcon}</Button>
        </div>
    )
}

export default AuctionList