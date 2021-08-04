import React, { useEffect, useState } from 'react';
import './Startpage.css'
import api from '../../api/ApiHelper';
import { Badge, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { Person as PersonIcon, Timer as TimerIcon, FiberNew as NewIcon, Fireplace as FireIcon, Announcement as AnnouncementIcon } from '@material-ui/icons';
import moment from 'moment';
import Tooltip from '../Tooltip/Tooltip';
import { useMatomo } from '@datapunt/matomo-tracker-react';

function Startpage() {

    let { trackEvent } = useMatomo();

    let [newAuctions, setNewAuctions] = useState<Auction[]>([{ uuid: "", bin: false, end: new Date(), highestBid: 0, item: { tag: "ASPECT_OF_THE_END", name: "Loading ..." }, startingBid: 0 }]);
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

        attachScrollEvent('cards-wrapper');
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

    function getEndString(end: Date) {
        let momentDate = moment(end);
        return end.getTime() < new Date().getTime() ? "Ended " + momentDate.fromNow() : "Ends " + momentDate.fromNow()
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
                                    <li>{getEndString(auction.end)}</li>
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

    function onRecentChangesClick() {
        trackEvent({
            category: 'recentChanges',
            action: 'recentChangesClicked'
        })
    }

    function attachScrollEvent(className: string) {
        let scrollContainers = document.getElementsByClassName(className);
        for (var i = 0; i < scrollContainers.length; i++) {
            let container = scrollContainers.item(i);
            if (container) {
                container.addEventListener("wheel", (evt) => {
                    evt.preventDefault();
                    let scrollAmount = 0;
                    var slideTimer = setInterval(() => {
                        container!.scrollLeft += (evt as WheelEvent).deltaY / 10;
                        scrollAmount += Math.abs((evt as WheelEvent).deltaY) / 10;
                        if (scrollAmount >= Math.abs((evt as WheelEvent).deltaY)) {
                            clearInterval(slideTimer);
                        }
                    }, 25);
                });
            }
        }
    }

    let newAuctionsElement = (
        <div className="cards-wrapper new-auctions">{
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
                                <div style={{ float: "left" }}>
                                    <img crossOrigin="anonymous" className="player-head-icon" src={search.url.includes("/player") ? search.img + '?size=8' : search.img} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                </div>
                                <Card.Title>{search.title}</Card.Title>
                            </Card.Header>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    )

    let endedAuctionsElement = (
        <div className="cards-wrapper ended-auctions">{
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
                                    <img crossOrigin="anonymous" className="player-head-icon" src={newPlayer.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
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

    return (
        <div className="startpage">
            <div style={{ textAlign: "center" }}>
                <hr />
                <h1>Skyblock AH history</h1>
                <p style={{ fontSize: "larger" }}>Browse through 250 million auctions, over two million players and the bazaar of hypixel skyblock</p>
                <hr />
            </div>
            <div className="startpage-list-element-wrapper">
                <Card style={{ width: "100%" }}>
                    <Card.Header>
                        <Card.Title><AnnouncementIcon /><span style={{ color: "#40ff00" }}> News / Announcements</span></Card.Title>
                        <Card.Subtitle>Active auctions</Card.Subtitle>
                    </Card.Header>
                    <Card.Body>
                        <p>
                            You can now also see, filter and browse active auctions for any item in the ah. <br />
                            If you find yourself missing a filter please ask for it on our discord.
                        </p>
                        <p>
                            The flipper displays the rarity of items as well as the seller and the lowest bin by item type.
                        </p>
                        <hr />
                        <div style={{ marginTop: "20px" }}>
                            <p>Recent changes (last change: 25.07.2021):</p>
                            <Tooltip onClick={onRecentChangesClick} content={<p><NewIcon /> <span style={{ color: "#007bff", cursor: "pointer" }}>Click here to open</span></p>} tooltipContent={
                                <ul>
                                    <li className="changelog-item">Active auctions</li>
                                    <li className="changelog-item">Filter improvements</li>
                                    <li className="changelog-item">Flipper flip rework</li>
                                    <li className="changelog-item">New reworked sidebar</li>
                                    <li className="changelog-item">Improved non-premium flipper (still delayed by a few minutes)</li>
                                    <li className="changelog-item">Implementation of the <Link to="/ref">Refferal-System</Link></li>
                                    <li className="changelog-item">You can now find enchantments directly in the searchbar</li>
                                    <li className="changelog-item">Easy scrolling in horizontal lists</li>
                                    <li className="changelog-item">Multiple bugs fixed</li>
                                </ul>} type="click" tooltipTitle={<span>Recent changes</span>} />
                        </div>
                    </Card.Body>
                </Card>
            </div>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title><NewIcon /> New auctions</Card.Title>
                </Card.Header>
                <Card.Body>
                    {newAuctionsElement}
                </Card.Body>
            </Card>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title><TimerIcon /> Ended auctions</Card.Title>
                </Card.Header>
                <Card.Body>
                    {endedAuctionsElement}
                </Card.Body>
            </Card>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title><PersonIcon /> New players</Card.Title>
                </Card.Header>
                <Card.Body>
                    {newPlayersElement}
                </Card.Body>
            </Card>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title><FireIcon /> Popular searches</Card.Title>
                </Card.Header>
                <Card.Body>
                    {popularSearchesElement}
                </Card.Body>
            </Card>

            <Card className="startpage-list-element-wrapper">
                <Card.Header>
                    <Card.Title><NewIcon /> New items</Card.Title>
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
                    <p>
                        View, search, browse, and filter by reforge or enchantment.
                    </p>
                    <p>
                        You can find all current and historic prices for the auction house and bazaar on this web tracker.
                    </p>
                    <p>
                        We are tracking about 200 million auctions. Saved more than 250 million bazaar prices in intervalls of 10 seconds.
                        Furthermore there are over two million skyblock players that you can search by minecraft user name.
                        You can browse through the auctions they made over the past two years.
                        New Items are added automatically and available within two miniutes after the first auction is startet.
                    </p>
                    <p>
                        The autocomplete search is ranked by popularity and allows you to find whatever item you want faster.
                        Quick urls allow you to link to specific sites. /p/Steve or /i/Oak allow you to create a link without visiting the site first.
                    </p>
                    <p>
                        The free accessible <Link to="/flipper">auction house flipper</Link> allows you to find profitable ah flips in no time.
                        It suplements the option to browse all of the skyblock history on the web tracker.
                        Whats more you can see what auctions were used as reference to determine if a flip is profitable.
                    </p>
                    <p>
                        We allow you to subscribe to auctions, item prices and being outbid with more to come.
                        Please use the contact on the Feedback site to send us suggestions or bug reports.
                    </p>

                </Card.Body>
            </Card>
        </div>
    );
}

export default Startpage;
