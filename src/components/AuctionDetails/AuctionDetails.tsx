import React, { useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import './AuctionDetails.css';
import { useHistory } from "react-router-dom";

interface Props {
    auctionUUID: string
}

function AuctionDetails(props: Props) {

    let history = useHistory();

    let [auctionDetails, setAuctionDetails] = useState<AuctionDetails>();

    useEffect(() => {
        if (!auctionDetails) {
            loadAuctionDetails()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    let loadAuctionDetails = () => {
        api.getAuctionDetails(props.auctionUUID).then(auctionDetails => {
            setAuctionDetails(auctionDetails);
        })
    }

    let onBack = () => {
        history.goBack();
    }

    return (
        <div className="auction-details">
            <button onClick={onBack}>Zurück</button>
            <p>Auction: {JSON.stringify(auctionDetails)}</p>
        </div>
    )
}

export default AuctionDetails