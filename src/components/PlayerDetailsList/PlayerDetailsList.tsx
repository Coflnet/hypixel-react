import React, { useEffect, useState } from 'react';
import { Badge, Button, ListGroup } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../../api/ApiHelper';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter';
import './PlayerDetailsList.css';
import { useHistory } from "react-router-dom";
import { useForceUpdate } from '../../utils/Hooks';
import SubscribeButton from '../SubscribeButton/SubscribeButton';
import { Link } from 'react-router-dom';
import { ArrowUpward as ArrowUpIcon } from '@material-ui/icons'
import { CopyButton } from '../CopyButton/CopyButton';

interface Props {
    playerUUID: string,
    loadingDataFunction: Function,
    type: "auctions" | "bids"
}

interface ListState {
    listElements: (Auction | BidForList)[],
    allElementsLoaded: boolean,
    yOffset: number,
    playerUUID: string,
    type: "auctions" | "bids"
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

// States, to remember the positions in the list, after coming back
let listStates: ListState[] = [];

function PlayerDetailsList(props: Props) {

    let history = useHistory();
    let forceUpdate = useForceUpdate();

    let [listElements, setListElements] = useState<(Auction | BidForList)[]>([]);
    let [allElementsLoaded, setAllElementsLoaded] = useState(false);
    let [playerName, setPlayerName] = useState("");

    useEffect(() => {
        mounted = true;

        let unlisten = history.listen(onHistoryListen);

        return () => {
            mounted = false;
            unlisten();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {

        api.getPlayerName(props.playerUUID).then((name) => {
            if (!mounted) {
                return;
            }
            setPlayerName(name);
        })

        let listState = getListState();
        if (listState !== undefined) {
            setListElements(listState.listElements);
            setAllElementsLoaded(listState.allElementsLoaded);
            setTimeout(() => {
                if (!mounted) {
                    return;
                }
                window.scrollTo({
                    left: 0,
                    top: listState!.yOffset,
                    behavior: "auto"
                })
            }, 100);
        } else {
            window.scrollTo(0, 0);
            setAllElementsLoaded(false);
            setListElements([]);
            loadNewElements(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.playerUUID, props.type]);

    let onHistoryListen = () => {
        let listState = getListState();
        if (listState) {
            listState.yOffset = window.pageYOffset;
        }
    }

    let loadNewElements = (reset?: boolean): void => {
        props.loadingDataFunction(props.playerUUID, 10, reset ? 0 : listElements.length).then(newListElements => {

            if (!mounted) {
                return;
            }

            if (newListElements.length === 0) {
                allElementsLoaded = true;
                setAllElementsLoaded(true);
            }

            listElements = reset ? newListElements : listElements.concat(newListElements);

            newListElements.forEach(auction => {
                loadItemImage(auction.item, auction.uuid, listElements);
            })
            setListElements(listElements);
            updateListState();

            if (listElements.length < 10 && newListElements.length !== 0) {
                loadNewElements();
            }

        }).catch(() => {
            setAllElementsLoaded(true);
        });
    }

    let loadItemImage = (item: Item, auctionUUID: string, listElements: (Auction | BidForList)[]): void => {
        api.getItemImageUrl(item).then((iconUrl => {
            let updatedListElements = listElements.slice();
            let listElement = updatedListElements.find(a => a.uuid === auctionUUID);
            if (listElement) {
                listElement.item.iconUrl = iconUrl;
            }
            setListElements(updatedListElements);
        }));;
    }

    let getCoinImage = () => {
        return (
            <img src="/Coin.png" height="35px" width="35px" alt="auction house logo" loading="lazy" />
        );
    }

    let getItemImageElement = (listElement: Auction | BidForList) => {
        return (
            listElement.item.iconUrl ? <img crossOrigin="anonymous" className="auction-item-image" src={listElement.item.iconUrl} alt="item icon" height="48" width="48" onError={(error) => onImageLoadError(listElement, error)} loading="lazy" /> : undefined
        )
    }

    let onImageLoadError = (listElement: Auction | BidForList, data: any) => {
        api.getItemDetails(listElement.item.tag || listElement.item.name!).then((item) => {
            listElement.item.iconUrl = item.iconUrl;
            setListElements(listElements);
            forceUpdate();
        })
    }

    let updateListState = () => {
        let listState = getListState();
        if (listState) {
            listState.allElementsLoaded = allElementsLoaded;
            listState.listElements = listElements;
        } else {
            listStates.push({
                type: props.type,
                listElements: listElements,
                playerUUID: props.playerUUID,
                yOffset: window.pageYOffset,
                allElementsLoaded: allElementsLoaded
            })
        }
    }

    let getListState = (): ListState | undefined => {
        return listStates.find(state => {
            return state.playerUUID === props.playerUUID && state.type === props.type;
        })
    }

    let bottomElements = (
        <div className="fixed-bottom">
            {
                props.type === "auctions" ?
                    <span>
                        <div className="btn-bottom"><Button type="primary" className="up-button" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }) }}><ArrowUpIcon /></Button></div>
                        <CopyButton buttonVariant="primary" buttonWrapperClass="btn-bottom" copyValue={"/ah " + playerName} successMessage={<p>Copied ingame link <br /> <i>/ah {playerName}</i></p>} />
                        <div className="btn-bottom"><SubscribeButton type="player" topic={props.playerUUID} /></div>
                    </span> : ""
            }
            {
                props.type === "bids" ?
                    <span>
                        <div className="btn-bottom"><Button type="primary" className="up-button" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }) }}><ArrowUpIcon /></Button></div>
                        <div className="btn-bottom"><SubscribeButton type="player" topic={props.playerUUID} /></div>
                    </span> : ""
            }
        </div>
    );

    let list = listElements.map((listElement, i) => {
        return (
            <ListGroup.Item action className="list-group-item">
                <Link className="disable-link-style list-item-link" key={listElement.uuid} to={`/auction/${listElement.uuid}`}>
                    <h4>
                        {
                            getItemImageElement(listElement)
                        }
                        {listElement.item.name || convertTagToName(listElement.item.tag)}
                        {listElement.end.getTime() < Date.now() || (listElement.bin && listElement.highestBid > 0) ? <Badge variant="danger" style={{ marginLeft: "10px" }}>Ended</Badge> : <Badge variant="info" style={{ marginLeft: "10px" }}>Running</Badge>}
                        {listElement.bin ? <Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge> : ""}
                    </h4>
                    <p>Highest Bid: {numberWithThousandsSeperators(listElement.highestBid)} {getCoinImage()}</p>
                    {
                        props.type === "auctions" ?
                            <p>Starting Bid: {numberWithThousandsSeperators((listElement as Auction).startingBid)} {getCoinImage()}</p> :
                            <p>Highest Own: {numberWithThousandsSeperators((listElement as BidForList).highestOwn)} {getCoinImage()}</p>
                    }
                    <p>End of Auction: {listElement.end.toLocaleTimeString() + " " + listElement.end.toLocaleDateString()}</p>
                </Link>
            </ListGroup.Item>
        )
    });

    return (
        <div className="player-details-list">
            {
                listElements.length === 0 && allElementsLoaded ?
                    <div className="noAuctionFound"><img src="/Barrier.png" width="24" height="24" alt="not found icon" style={{ float: "left", marginRight: "5px" }} /> <p>No auctions found</p></div> :
                    <InfiniteScroll style={{ overflow: "hidden" }} dataLength={listElements.length} next={loadNewElements} hasMore={!allElementsLoaded} loader={getLoadingElement()}>
                        <ListGroup className="list">
                            {list}
                        </ListGroup>
                    </InfiniteScroll>
            }
            {
                bottomElements
            }
        </div >
    )
}

export default PlayerDetailsList