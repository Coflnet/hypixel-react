import React, { useEffect, useState } from 'react';
import { Badge, Button, ListGroup } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../../api/ApiHelper';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import './AuctionList.css';
import { useHistory } from "react-router-dom";
import { useForceUpdate } from '../../utils/Hooks';
import SubscribeButton from '../SubscribeButton/SubscribeButton';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowUpward as ArrowUpIcon } from '@material-ui/icons'

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
    let [copyButtonClicked, setCopyButtonClicked] = useState(false);

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
        api.getAuctions(props.playerUUID, 10, reset ? 0 : auctions.length).then(newAuctions => {

            if (!mounted) {
                return;
            }

            if (newAuctions.length === 0) {
                allAuctionsLoaded = true;
                setAllAuctinosLoaded(true);
            }

            auctions = reset ? newAuctions : auctions.concat(newAuctions);

            newAuctions.forEach(auction => {
                loadItemImage(auction.item, auction.uuid, auctions);
            })
            setAuctions(auctions);
            updateListState();

            if(auctions.length < 10 && newAuctions.length !== 0){
                loadNewAuctions();
            }

        }).catch(() => {
            setAllAuctinosLoaded(true);
        });
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
            <img src="/Coin.png" height="35px" width="35px" alt="auction house logo" loading="lazy" />
        );
    }

    let getItemImageElement = (auction: Auction) => {
        return (
            auction.item.iconUrl ? <img crossOrigin="anonymous" className="auction-item-image" src={auction.item.iconUrl} alt="item icon" height="48" width="48" onError={(error) => onImageLoadError(auction, error)} loading="lazy" /> : undefined
        )
    }

    let onImageLoadError = (auction: Auction, data: any) => {
        api.getItemDetails(auction.item.tag || auction.item.name!).then((item) => {
            auction.item.iconUrl = item.iconUrl;
            setAuctions(auctions);
            forceUpdate();
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

    let copyIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
        </svg>
    );

    let copiedIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard-check" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
        </svg>
    );

    let copyClick = () => {
        api.getPlayerName(props.playerUUID).then(playerName => {
            setCopyButtonClicked(true);
            window.navigator.clipboard.writeText("/ah " + playerName);
            toast.success(<p>Copied ingame link <br /> <i>/ah {playerName}</i></p>)
        });
    }

    let auctionList = auctions.map(auction => {
        return (
            <Link className="disable-link-style" key={auction.uuid} to={`/auction/${auction.uuid}`}>
                <ListGroup.Item action>
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
            </Link>
        )
    });

    return (
        <div className="auction-list">
            {
                auctions.length === 0 && allAuctionsLoaded ?
                    <div className="noAuctionFound"><img src="/Barrier.png" width="24" height="24" alt="not found icon" style={{ float: "left", marginRight: "5px" }} /> <p>No auctions found</p></div> :
                    <InfiniteScroll style={{ overflow: "hidden" }} dataLength={auctions.length} next={loadNewAuctions} hasMore={!allAuctionsLoaded} loader={getLoadingElement()}>
                        <ListGroup>
                            {auctionList}
                        </ListGroup>
                    </InfiniteScroll>
            }
            <div className="fixed-bottom">
                <div className="btn-bottom"><Button type="primary" className="up-button" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }) }}><ArrowUpIcon /></Button></div>
                {window.navigator.clipboard ? <div className="btn-bottom"><Button type="primary" onClick={copyClick}>{copyButtonClicked ? copiedIcon : copyIcon}</Button></div> : ""}
                <div className="btn-bottom"><SubscribeButton type="player" topic={props.playerUUID} /></div>
            </div >
        </div >
    )
}

export default AuctionList