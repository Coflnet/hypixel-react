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
import { FixedSizeList as List } from 'react-window';

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

        attachScrollEvent('startpage-list-element-wrapper');
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

    function getAuctionElement(auction: Auction, style: React.CSSProperties) {
        return (
            <div className="card-wrapper" key={auction.uuid} style={style}>
                <Link className="disable-link-style" to={`/auction/${auction.uuid}`}>
                    <Card className="card">
                        <Card.Header style={{ padding: "10px" }}>
                            <p className="ellipsis">
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
            <List
                className="startpage-list-element-wrapper"
                height={250}
                itemCount={newAuctions.length}
                itemSize={200}
                layout="horizontal"
                width={document.getElementById('new-auctions-body')?.offsetWidth || 100}
            >
                {({ index, style }) => {
                    return getAuctionElement(newAuctions[index], style);
                }}
            </List>
        }
        </div >
    )

    let popularSearchesElement = (
        <div className="cards-wrapper">
            <List
                className="startpage-list-element-wrapper"
                height={100}
                itemCount={popularSearches.length}
                itemSize={200}
                layout="horizontal"
                width={document.getElementById('popular-searches-body')?.offsetWidth || 100}
            >
                {({ index, style }) => {
                    let search = popularSearches[index];
                    return <div className="card-wrapper" key={search.url} style={style}>
                        <Link className="disable-link-style" to={search.url}>
                            <Card className="card">
                                <Card.Header style={{ height: "100%" }}>
                                    <div style={{ float: "left" }}>
                                        <img crossOrigin="anonymous" className="player-head-icon" src={search.url.includes("/player") ? search.img + '?size=8' : search.img} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    </div>
                                    <Card.Title className="ellipsis">{search.title}</Card.Title>
                                </Card.Header>
                            </Card>
                        </Link>
                    </div>
                }}
            </List>
        </div>
    )

    let endedAuctionsElement = (
        <div className="cards-wrapper ended-auctions">
            <List
                className="startpage-list-element-wrapper"
                height={250}
                itemCount={endedAuctions.length}
                itemSize={200}
                layout="horizontal"
                width={document.getElementById('ended-auctions-body')?.offsetWidth || 100}
            >
                {({ index, style }) => {
                    return getAuctionElement(endedAuctions[index], style);
                }}
            </List>
        </div>
    )

    let newPlayersElement = (
        <div className="cards-wrapper">
            <List
                className="startpage-list-element-wrapper"
                height={100}
                itemCount={newPlayers.length}
                itemSize={200}
                layout="horizontal"
                width={document.getElementById('new-players-body')?.offsetWidth || 100}
            >
                {({ index, style }) => {
                    let newPlayer = newPlayers[index];
                    return <div className="card-wrapper" key={newPlayer.name} style={style}>
                        <Link className="disable-link-style" to={`/player/${newPlayer.uuid}`}>
                            <Card className="card">
                                <Card.Header style={{ height: "100%", padding: "20px" }}>
                                    <div style={{ float: "left" }}>
                                        <img crossOrigin="anonymous" className="player-head-icon" src={newPlayer.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    </div>
                                    <Card.Title className="ellipsis">{newPlayer.name}</Card.Title>
                                </Card.Header>
                            </Card>
                        </Link>
                    </div>
                }}
            </List>
        </div>
    )

    let newItemsElement = (
        <div className="cards-wrapper">
            <List
                className="startpage-list-element-wrapper"
                height={100}
                itemCount={newItems.length}
                itemSize={200}
                layout="horizontal"
                width={document.getElementById('new-items-body')?.offsetWidth || 100}
            >
                {({ index, style }) => {
                    let newItem = newItems[index];
                    return <div className="card-wrapper" key={newItem.tag} style={style}>
                        <Link className="disable-link-style" to={`/item/${newItem.tag}`}>
                            <Card className="card">
                                <Card.Header style={{ height: "100%", padding: "20px" }}>
                                    <div style={{ float: "left" }}>
                                        <img crossOrigin="anonymous" src={newItem.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    </div>
                                    <Card.Title className="ellipsis">{newItem.name}</Card.Title>
                                </Card.Header>
                            </Card>
                        </Link>
                    </div>
                }}
            </List>
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
            <div className="status-element-wrapper">
                <Card style={{ width: "100%" }}>
                    <Card.Header>
                        <Card.Title><AnnouncementIcon /><span style={{ color: "#40ff00" }}> News / Announcements</span></Card.Title>
                        <Card.Subtitle>Flipper item blacklist</Card.Subtitle>
                    </Card.Header>
                    <Card.Body>
                        <p>The flipper now allows you to <b>blacklist</b> items you don't want to see again.</p>
                        <p>The customization feature allows you to hide information in flips you don't want to see.</p>
                        <hr />
                        <div style={{ marginTop: "20px" }}>
                            <p>Recent changes (last change: 21.08.2021):</p>
                            <Tooltip onClick={onRecentChangesClick} content={<p><NewIcon /> <span style={{ color: "#007bff", cursor: "pointer" }}>Click here to open</span></p>} tooltipContent={
                                <ul>
                                    <li className="changelog-item">Flipper item blacklist</li>
                                    <li className="changelog-item">Flipper customization</li>
                                    <li className="changelog-item">Flipper filter style upgrade</li>
                                    <li className="changelog-item">Improved server infrastructure</li>
                                    <li className="changelog-item">Fixed bug that blocked the copy button on flips</li>
                                </ul>} type="click" tooltipTitle={<span>Recent changes</span>} />
                        </div>
                    </Card.Body>
                </Card>
            </div>

            <Card className="startpage-card">
                <Card.Header>
                    <Card.Title><NewIcon /> New auctions</Card.Title>
                </Card.Header>
                <Card.Body className="startpage-card-body" id="new-auctions-body">
                    {newAuctionsElement}
                </Card.Body>
            </Card>

            <Card className="startpage-card">
                <Card.Header>
                    <Card.Title><TimerIcon /> Ended auctions</Card.Title>
                </Card.Header>
                <Card.Body className="startpage-card-body" id="ended-auctions-body">
                    {endedAuctionsElement}
                </Card.Body>
            </Card>

            <Card className="startpage-card">
                <Card.Header>
                    <Card.Title><PersonIcon /> New players</Card.Title>
                </Card.Header>
                <Card.Body className="startpage-card-body" id="new-players-body">
                    {newPlayersElement}
                </Card.Body>
            </Card>

            <Card className="startpage-card">
                <Card.Header>
                    <Card.Title><FireIcon /> Popular searches</Card.Title>
                </Card.Header>
                <Card.Body className="startpage-card-body" id="popular-searches-body">
                    {popularSearchesElement}
                </Card.Body>
            </Card>

            <Card className="startpage-card">
                <Card.Header>
                    <Card.Title><NewIcon /> New items</Card.Title>
                </Card.Header>
                <Card.Body className="startpage-card-body" id="new-items-body">
                    {newItemsElement}
                </Card.Body>
            </Card>

            <Card className="startpage-card" style={{ marginTop: "40px" }}>
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
                        We're tracking about 200 million auctions. We've saved more than 250 million bazaar prices in intervals of 10 seconds.
                        Furthermore, there are over two million skyblock players that you can search by their Minecraft usernames.
                        You can browse through the auctions they made over the past two years.
                        New Items are added automatically and available within two miniutes after the first auction is started.
                    </p>
                    <p>
                        The search autocomplete is ranked by popularity and allows you to find whatever item you want faster.
                        Quick urls allow you to link to specific sites. /p/Steve or /i/Oak allows you to create a link without visiting the site first.
                    </p>
                    <p>
                        The free accessible <Link to="/flipper">auction house flipper</Link> allows you to find profitable ah flips in no time.
                        It supplements the option to browse all of the skyblock history on the web tracker.
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
