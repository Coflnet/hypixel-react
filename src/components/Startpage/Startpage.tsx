import React, { useEffect, useState } from 'react';
import './Startpage.css'
import api from '../../api/ApiHelper';
import { Badge, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import moment from 'moment';

function Startpage() {

    let [newAuctions, setNewAuctions] = useState<Auction[]>([]);
    let [endedAuctions, setEndedAuctions] = useState<Auction[]>([]);
    let [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
    let [newPlayers, setNewPlayers] = useState<Player[]>([]);
    let [newItems, setNewItems] = useState<Item[]>([]);

    useEffect(() => {
        loadNewAuctions();
        loadPopularSearches();
        loadEndedAuctions();
        loadNewPlayers();
        loadNewItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                setNewAuctions(auctions);
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

            let promises: Promise<void>[] = [];
            endedAuctions.forEach(auction => {
                promises.push(api.getItemImageUrl(auction.item).then(url => {
                    auction.item.iconUrl = url;
                }).catch(() => { }));
            })
            Promise.all(promises).then(() => {
                setEndedAuctions(endedAuctions);
            })
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
            let promises: Promise<void>[] = [];
            newItems.forEach(item => {
                promises.push(api.getItemImageUrl(item).then(url => {
                    item.iconUrl = url;
                }).catch(() => { }));
            })
            Promise.all(promises).then(() => {
                setNewItems(newItems);
            })
        })
    }

    function getAuctionElement(auction: Auction) {
        return (
            <div className="card-wrapper" key={auction.uuid}>
                <Link className="disable-link-style" to={`/auction/${auction.uuid}`}>
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
                                    {auction.bin ? <li><Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge></li> : ""}
                                </ul>
                            </div>
                        </Card.Body>
                    </Card>
                </Link>
            </div>
        )
    }

    let newAuctionsElement = (
        <div className="cards-wrapper">{
            newAuctions.map(getAuctionElement)
        }
        </div >
    )

    let popularSearchesElement = (
        <div className="cards-wrapper">{
            popularSearches.map(search =>
            (
                <div className="card-wrapper" key={search.url}>
                    <Link className="disable-link-style" to={search.url}>
                        <Card className="card">
                            <Card.Header style={{ height: "100%" }}>
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
            endedAuctions.map(getAuctionElement)}
        </div>
    )

    let newPlayersElement = (
        <div className="cards-wrapper">{
            newPlayers.map(newPlayer =>
            (
                <div className="card-wrapper" key={newPlayer.uuid}>
                    <Link className="disable-link-style" to={`/player/${newPlayer.uuid}`}>
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
                <div className="card-wrapper" key={newItem.tag}>
                    <Link className="disable-link-style" to={`/item/${newItem.tag}`}>
                        <Card className="card">
                            <Card.Header style={{ height: "100%" }}>
                                <div style={{ float: "left" }}>
                                    <img crossOrigin="anonymous" src={newItem.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    {newItem.name}
                                </div>
                            </Card.Header>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    )

    //style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "stretch" }}

    return (
        <div className="startpage">

            <div className="startpage-list-element-wrapper">
                <Card style={{ width: "100%" }}>
                    <Card.Header>
                        <Card.Title style={{ color: "#40ff00" }}>News / Announcements</Card.Title>
                        <Card.Subtitle>Free Premium Extenstion</Card.Subtitle>
                    </Card.Header>
                    <Card.Body>
                        While writing this hypixel conducts maintinance to its servers. Since our <Link to="/premium">premium plan</Link> isn't of much use when there are no new auctions, we are extending the subscriptions of our premium users for as long as this maintinance will last/lasted.
                    </Card.Body>
                </Card>
            </div>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title>New auctions</Card.Title>
                </Card.Header>
                <Card.Body>
                    {newAuctionsElement}
                </Card.Body>
            </Card>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title>Ended auctions</Card.Title>
                </Card.Header>
                <Card.Body>
                    {endedAuctionsElement}
                </Card.Body>
            </Card>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title>New players</Card.Title>
                </Card.Header>
                <Card.Body>
                    {newPlayersElement}
                </Card.Body>
            </Card>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title>Popular searches</Card.Title>
                </Card.Header>
                <Card.Body>
                    {popularSearchesElement}
                </Card.Body>
            </Card>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title>New items</Card.Title>
                </Card.Header>
                <Card.Body>
                    {newItemsElement}
                </Card.Body>
            </Card>

            <Card style={{ width: "100%", marginTop: "40px" }}>
                <Card.Header>
                    <Card.Title>Hypixel AH history</Card.Title>
                </Card.Header>
                <Card.Body>
                    View, search, browse, and filter by reforge or enchantment. You can find all current and historic prices for the auction house and bazaar on this web tracker. We are tracking about 200 million auctions. Saved more than 250 million bazaar prices in intervalls of 10 seconds. Furthermore there are over two million skyblock players that you can search by name and browse through the auctions they made over the past two years. The autocomplete search is ranked by popularity and allows you to find whatever item you want faster. New Items are added automatically and available within two miniutes after the first auction is startet. We allow you to subscribe to auctions, item prices and being outbid with more to come. Quick urls allow you to link to specific sites. /p/Steve or /i/Oak allow you to create a link without visiting the site first. Please use the contact on the Feedback site to send us suggestions or bug reports.
                </Card.Body>
            </Card>
        </div>
    );
}

export default Startpage;