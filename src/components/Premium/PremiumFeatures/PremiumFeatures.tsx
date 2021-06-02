import React from "react";
import './PremiumFeatures.css';
import { Card } from "react-bootstrap";
import { SentimentSatisfiedAlt as EmojiIcon } from '@material-ui/icons';


function PremiumFeatures() {

    return (
        <div className="premium-features">
            <Card className="feature-card">
                <Card.Header>
                    <Card.Title>Full Item-Flipper access</Card.Title>
                </Card.Header>
                <Card.Body>
                    Use the full functionality of the Flipper. Get the latest available profitable Auctions.
                    You can filter for minimum Profit and to only show BIN-Auctions.
                    </Card.Body>
            </Card>
            <Card className="feature-card">
                <Card.Header>
                    <Card.Title>Up to 100 subscriptions</Card.Title>
                </Card.Header>
                <Card.Body>
                    Have up to 100 subscriptions at once. Get notified of important changes from players, auctions and items.
                    </Card.Body>
            </Card>
            <Card className="feature-card">
                <Card.Header>
                    <Card.Title>Priority feature request</Card.Title>
                </Card.Header>
                <Card.Body>
                    Do you have an idea for a useful feature? Just contact us and if we think it would fit and is realisicly possible, your suggestion will be implemented as fast as possible.
                </Card.Body>
            </Card>
            <Card className="feature-card">
                <Card.Header>
                    <Card.Title>Our thank you</Card.Title>
                </Card.Header>
                <Card.Body>
                    We are only a small team of developers who develop this application in our spare time. It would really mean a lot to us if you are able to support us.
                    The money will primarily be used to pay for the server to improve the speed and reliability of our service. <br />
                    Thank you. You are the best <EmojiIcon />
                </Card.Body>
            </Card>
        </div>
    )
}

export default PremiumFeatures;
