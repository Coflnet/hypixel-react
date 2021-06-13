import React, { useEffect, useState } from 'react';
import './Startpage.css'
import NavBar from '../NavBar/NavBar';
import api from '../../api/ApiHelper';
import { Badge, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import moment from 'moment';
import { useForceUpdate } from '../../utils/Hooks';

function Startpage() {

    let [newAuctions, setNewAuctions] = useState<Auction[]>([]);
    let [endedAuctions, setEndedAuctions] = useState<Auction[]>([]);
    let [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
    let [newPlayers, setNewPlayers] = useState<Player[]>([]);
    let [newItems, setNewItems] = useState<Item[]>([]);

    let forceUpdate = useForceUpdate();

    useEffect(() => {
        loadNewAuctions();
        loadPopularSearches();
        loadEndedAuctions();
        loadNewPlayers();
        loadNewItems();
    }, [])

    let loadNewAuctions = () => {
        api.getNewAuctions().then(auctions => {
            let promises: Promise<void>[] = [];

            auctions.forEach(auction => {
                promises.push(api.getItemImageUrl(auction.item).then(url => {
                    auction.item.iconUrl = url;
                }).catch(() => { }));
            })

            Promise.all(promises).then(() => {
                setNewAuctions(newAuctions);
                forceUpdate();
            })

            setNewAuctions(auctions);
        });
    }

    let loadPopularSearches = () => {
        api.getPopularSearches().then(popularSearches => {
            setPopularSearches(popularSearches);
        });
    }

    let loadEndedAuctions = () => {
        api.getEndedAuctions().then(endedAuctions => {
            setEndedAuctions(endedAuctions);
        });
    }

    let loadNewPlayers = () => {
        api.getNewPlayers().then(newPlayers => {
            setNewPlayers(newPlayers);
        })
    }

    let loadNewItems = () => {
        api.getNewItems().then(newItems => {
            setNewItems(newItems);
        })
    }

    let newAuctionsElement = (
        <div className="cards-wrapper">{
            newAuctions.map(auction =>
            (
                <div className="cardWrapper" key={auction.uuid}>
                    <Link to={`/auction/${auction.uuid}`}>
                        <Card className="card">
                            <Card.Header style={{ padding: "10px" }}>
                                <p className="ellipsis" style={{ width: "180px" }}>
                                    <img crossOrigin="anonymous" src={auction.item.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    {auction.item.name}
                                </p>
                            </Card.Header>
                            <Card.Body>
                                <div>
                                    <ul>
                                        <li>Ends {moment(auction.end).fromNow()}</li>
                                        <li>{numberWithThousandsSeperators(auction.highestBid || auction.startingBid)} Coins</li>
                                        <li>{auction.bin ? <Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge> : ""}</li>
                                    </ul>
                                </div>
                            </Card.Body>
                        </Card>
                    </Link>
                </div>
            ))
        }
        </div >
    )

    let popularSearchesElement = (
        <div className="cards-wrapper">{
            popularSearches.map(search =>
            (
                <div className="cardWrapper">
                    <Link to={search.url}>
                        <Card className="card">
                            <Card.Header style={{ padding: "10px" }}>
                                <Card.Title>{search.title}</Card.Title>
                            </Card.Header>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    )

    let endedAuctionsElement = (
        <div className="cards-wrapper">{
            endedAuctions.map(auction =>
            (
                <div className="cardWrapper" key={auction.uuid}>
                    <Link to={`/auction/${auction.uuid}`}>
                        <Card className="card">
                            <Card.Header style={{ padding: "10px" }}>
                                <div style={{ float: "left" }}>
                                    <img crossOrigin="anonymous" src={auction.item.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                </div>
                                <div>
                                    {numberWithThousandsSeperators(auction.highestBid)} Coins
                        </div>
                            </Card.Header>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    )

    let newPlayersElement = (
        <div className="cards-wrapper">{
            newPlayers.map(newPlayer =>
            (
                <div className="cardWrapper" key={newPlayer.uuid}>
                    <Link to={`/player/${newPlayer.uuid}`}>
                        <Card className="card">
                            <Card.Header style={{ padding: "10px" }}>
                                <div style={{ float: "left" }}>
                                    <img crossOrigin="anonymous" src={newPlayer.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                </div>
                                {newPlayer.name}
                            </Card.Header>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    )

    let newItemsElement = (
        <div className="cards-wrapper">{
            newItems.map(newItem =>
            (
                <div className="cardWrapper">
                    <Link to={`/item/${newItem.tag}`}>
                        <Card className="card">
                            <Card.Header style={{ padding: "10px" }}>
                                <div style={{ float: "left" }}>
                                    <img crossOrigin="anonymous" src={newItem.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                </div>
                            </Card.Header>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    )

    console.log(newAuctions);
    console.log(popularSearches);
    console.log(endedAuctions);
    console.log(newPlayers);
    console.log(newItems);
    console.log("-------------------------------")

    return (
        <div className="startpage">
            <h2>
                <NavBar />
                Skyblock AH history
            </h2>
            <hr />

            <div className="part-wrapper">
                <h3>New auctions</h3>
                {newAuctionsElement}
            </div>

            <h3>Popular searches</h3>
            { popularSearchesElement}

            <h3>Ended auctions</h3>
            { endedAuctionsElement}

            <h3>New players</h3>
            { newPlayersElement}

            <h3>New items</h3>
            { newItemsElement}
        </div>
    );
}

export default Startpage;