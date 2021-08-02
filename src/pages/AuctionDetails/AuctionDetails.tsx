import React, { useEffect } from 'react';
import AuctionDetails from '../../components/AuctionDetails/AuctionDetails';
import './AuctionDetails.css';
import { useParams } from "react-router-dom";
import { useForceUpdate } from '../../utils/Hooks';
import { Container } from 'react-bootstrap';
import Search from '../../components/Search/Search';

function AuctionDetailsPage() {

    let { auctionUUID } = useParams();
    let forceUpdate = useForceUpdate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        forceUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionUUID])

    return (
        <div className="auction-details-page">
            <Container>
                <Search />
                <AuctionDetails auctionUUID={auctionUUID} />
            </Container>
        </div >
    );
}

export default AuctionDetailsPage;
