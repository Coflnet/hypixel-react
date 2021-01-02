import React, { useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import './AuctionDetails.css';
import { useHistory } from "react-router-dom";
import { Accordion, Button, Card, Jumbotron } from 'react-bootstrap';

interface Props {
    auctionUUID: string
}

function useForceUpdate() {
    const [update, setUpdate] = useState(0);
    return () => setUpdate(update => update + 1);
}

function AuctionDetails(props: Props) {

    let history = useHistory();
    let [auctionDetails, setAuctionDetails] = useState<AuctionDetails>();
    let forceUpdate = useForceUpdate();

    useEffect(() => {
        if (!auctionDetails) {
            loadAuctionDetails()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionDetails?.auction.item.iconUrl])

    let loadAuctionDetails = () => {
        api.getAuctionDetails(props.auctionUUID).then(auctionDetails => {
            console.log(auctionDetails);
            setAuctionDetails(auctionDetails);
            api.getItemImageUrl(auctionDetails.auction.item).then(url => {
                auctionDetails.auction.item.iconUrl = url;
                forceUpdate();
            })
        })
    }

    let onBack = () => {
        history.goBack();
    }

    return (
        <div className="auction-details">
            <Button onClick={onBack}>Zurück</Button>
            <Jumbotron>
                <Card>
                    <Card.Header>{auctionDetails?.auction.item.name}</Card.Header>
                    <Card.Body>
                        <p><span className="label">Name:</span> {auctionDetails?.auction.item.name}</p>
                        <p><span className="label">Category:</span> {auctionDetails?.auction.item.category}</p>
                        <p><span className="label">Tag:</span> {auctionDetails?.auction.item.tag || "-"}</p>
                        <p><span className="label">Tier:</span> {auctionDetails?.auction.item.tier}</p>
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>Bids</Card.Header>
                    <Card.Body>
                        {auctionDetails?.bids.map(bid => {
                            return (<p>{bid.toString()}</p>)
                        })}
                    </Card.Body>
                </Card>
            </Jumbotron>
        </div>
    )
}

export default AuctionDetails