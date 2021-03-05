import React from 'react';
import AuctionDetails from '../../components/AuctionDetails/AuctionDetails';
import './AuctionDetails.css';
import { useParams } from "react-router-dom";

function AuctionDetailsPage() {

    let { auctionUUID } = useParams();

    return (
        <div className="auction-details-page">
            <AuctionDetails auctionUUID={auctionUUID} />
        </div >
    );
}

export default AuctionDetailsPage;
