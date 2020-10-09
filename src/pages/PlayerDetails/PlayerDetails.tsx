import React, { useEffect, useState } from 'react';
import Search from '../../components/Search/Search';
import './PlayerDetails.css';
import { useParams } from 'react-router-dom';
import api from '../../api/ApiHelper';

function PlayerDetails() {

    let { uuid } = useParams();
    let [playerDetails, setPlayerDetails] = useState<PlayerDetails>();

    let getPlayer = (uuid: string): Promise<PlayerDetails> => {
        return api.getPlayerDetails(uuid);
    }

    useEffect(() => {
        /*
        currently not working
        getPlayer(uuid).then((playerDetails) => {
            setPlayerDetails(playerDetails);
        })
        */
    }, [])

    let auctionList = playerDetails?.auctions.map(auction => {
        return (
            <ul>
                <li key={auction.uuid}>{auction.item.name}</li>
            </ul>)
    })
    let bidList = playerDetails?.bids.map(bid => {
        return (
            <ul>
                <li key={bid.auctionUUID + " - " + bid.item.name}>{bid.item.name}</li>
            </ul>)
    })

    return (
        <div className="player-details">
            <Search />
            <h1>PlayerDetails</h1>
            <p>Bids: </p>
            {bidList}
            <h2>Auctions: </h2>
            {auctionList}
        </div >
    );
}

export default PlayerDetails;
