import React, { useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import { Badge, Card } from 'react-bootstrap';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { Person as PersonIcon, Timer as TimerIcon, FiberNew as NewIcon, Fireplace as FireIcon, Announcement as AnnouncementIcon } from '@material-ui/icons';
import Tooltip from '../Tooltip/Tooltip';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import moment from 'moment';
import { FixedSizeList as List } from 'react-window';

function Startpage() {
    let { trackEvent } = useMatomo();

    let [newAuctions, setNewAuctions] = useState<Auction[]>([{ uuid: "", bin: false, end: new Date(), highestBid: 0, item: { tag: "ASPECT_OF_THE_END", name: "Loading ..." }, startingBid: 0 }]);
    let [endedAuctions, setEndedAuctions] = useState<Auction[]>([]);
    let [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
    let [newPlayers, setNewPlayers] = useState<Player[]>([]);
    let [newItems, setNewItems] = useState<Item[]>([]);

    useEffect(() => {

        attachScrollEvent('startpage-list-element-wrapper');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    let loadNewAuctions = () => {
    }

    let loadPopularSearches = () => {
        api.getPopularSearches().then(popularSearches => {
            setPopularSearches(popularSearches);
        });
    }

    let loadEndedAuctions = () => {
        api.getEndedAuctions().then(endedAuctions => {
            endedAuctions.forEach(auction => {
                auction.item.iconUrl = api.getItemImageUrl(auction.item);
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
            newItems.forEach(item => {
                item.iconUrl = api.getItemImageUrl(item);
            })
            setNewItems(newItems);
        })
    }

    function getEndString(end: Date) {
        let momentDate = moment(end);
        return end.getTime() < new Date().getTime() ? "Ended " + momentDate.fromNow() : "Ends " + momentDate.fromNow()
    }

    function getAuctionElement(auction: Auction, style: React.CSSProperties) {
        return (
            <div className="card-wrapper" key={auction.uuid} style={style}>
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
                width={typeof document !== "undefined" ? document.getElementById('new-auctions-body')?.offsetWidth : 100}
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
                width={typeof document !== "undefined" ? document.getElementById('popular-searches-body')?.offsetWidth : 100}
            >
                {({ index, style }) => {
                    let search = popularSearches[index];
                    return <div className="card-wrapper" key={search.url} style={style}>
                            <Card className="card">
                                <Card.Header style={{ height: "100%" }}>
                                    <div style={{ float: "left" }}>
                                        <img crossOrigin="anonymous" className="player-head-icon" src={search.url.includes("/player") ? search.img + '?size=8' : search.img} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    </div>
                                    <Card.Title className="ellipsis">{search.title}</Card.Title>
                                </Card.Header>
                            </Card>
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
                width={typeof document !== "undefined" ? document.getElementById('ended-auctions-body')?.offsetWidth : 100}
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
                width={typeof document !== "undefined" ? document.getElementById('new-players-body')?.offsetWidth : 100}
            >
                {({ index, style }) => {
                    let newPlayer = newPlayers[index];
                    return <div className="card-wrapper" key={newPlayer.name} style={style}>
                            <Card className="card">
                                <Card.Header style={{ height: "100%", padding: "20px" }}>
                                    <div style={{ float: "left" }}>
                                        <img crossOrigin="anonymous" className="player-head-icon" src={newPlayer.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    </div>
                                    <Card.Title className="ellipsis">{newPlayer.name}</Card.Title>
                                </Card.Header>
                            </Card>
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
                width={typeof document !== "undefined" ? document.getElementById('new-items-body')?.offsetWidth : 100}
            >
                {({ index, style }) => {
                    let newItem = newItems[index];
                    return <div className="card-wrapper" key={newItem.tag} style={style}>
                            <Card className="card">
                                <Card.Header style={{ height: "100%", padding: "20px" }}>
                                    <div style={{ float: "left" }}>
                                        <img crossOrigin="anonymous" src={newItem.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                    </div>
                                    <Card.Title className="ellipsis">{newItem.name}</Card.Title>
                                </Card.Header>
                            </Card>
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
                        <Card.Subtitle>Minecraft Mod (Alpha release)</Card.Subtitle>
                    </Card.Header>
                    <Card.Body>
                        <p>We created a Minecraft mod as a QoL-Feature. It connects to the website and shows the flips you get there in your Minecraft chat for you to click.</p>
                        <p>The mod can be downloaded on our <a target="_blank" rel="noreferrer" href="https://discord.gg/wNRgeCYmW9">discord</a> in the channel "mod-releases".</p>
                        <hr />
                        <div style={{ marginTop: "20px" }}>
                            <p>Recent changes (last change: 23.10.2021):</p>
                            <Tooltip onClick={onRecentChangesClick} content={<p><NewIcon /> <span style={{ color: "#007bff", cursor: "pointer" }}>Click here to open</span></p>} tooltipContent={
                                <ul>
                                    <li className="changelog-item">Integration of the alpha mod</li>
                                    <li className="changelog-item">Import/Export flipper settings</li>
                                    <li className="changelog-item">Context menu in the flipper</li>
                                    <li className="changelog-item">Lots of UI improvements</li>
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
                        The free accessible auction house flipper allows you to find profitable ah flips in no time.
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
