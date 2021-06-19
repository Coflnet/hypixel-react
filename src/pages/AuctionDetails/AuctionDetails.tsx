import React, { useEffect } from 'react';
import AuctionDetails from '../../components/AuctionDetails/AuctionDetails';
import './AuctionDetails.css';
import { useParams } from "react-router-dom";
import { useForceUpdate } from '../../utils/Hooks';
import { Container } from 'react-bootstrap';

function AuctionDetailsPage() {

    let { auctionUUID } = useParams();
    let forceUpdate = useForceUpdate();

    useEffect(() => {
        forceUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionUUID])

    return (
        <div className="auction-details-page">
            <Container>
                <AuctionDetails auctionUUID={auctionUUID} />
            </Container>
        </div >
    );
}

export default AuctionDetailsPage;
