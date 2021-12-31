import React, { useEffect, useState } from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { useParams } from 'react-router';
import api from '../../api/ApiHelper';
import { ArrowRightAlt as ArrowRightIcon } from '@material-ui/icons';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import './FlipTracking.css';

export function FlipTracking() {

    let { uuid } = useParams();
    let [totalProfit, setTotalProfit] = useState(0);
    let [trackedFlips, setTrackedFlips] = useState<FlipTrackingFlip[]>([]);

    useEffect(() => {
        api.getTrackedFlipsForPlayer(uuid).then(result => {
            setTotalProfit(result.totalProfit);
            setTrackedFlips(result.flips);
        })
    }, []);


    let list = trackedFlips.map((trackedFlip, i) => {

        return (
            <ListGroup.Item action className="list-group-item">
                <h1 style={{ fontSize: "x-large" }}>
                    <div className="ellipse">
                        {trackedFlip.itemName}
                    </div>
                </h1>
                <hr />
                <div style={{ display: "flex", "justifyContent": "space-around", "alignItems": "center" }}>
                    <Card style={{ width: "45%" }}>
                        <Card.Header>
                            <Card.Title>{numberWithThousandsSeperators(trackedFlip.pricePaid)} Coins</Card.Title>
                        </Card.Header>
                    </Card>
                    <ArrowRightIcon style={{ fontSize: "50px" }} />
                    <Card style={{ width: "45%" }}>
                        <Card.Header>
                            <Card.Title>{numberWithThousandsSeperators(trackedFlip.soldFor)} Coins</Card.Title>
                        </Card.Header>
                    </Card>
                </div>
            </ListGroup.Item>
        )
    });

    return (
        <div className="flip-tracking">
            <h2>Flip Tracking</h2>
            <hr />
            <b><p style={{ fontSize: "larger" }}>Total Profit: <span style={{ color: "gold" }}>{numberWithThousandsSeperators(totalProfit)} Coins</span></p></b>
            <hr />
            {
                trackedFlips.length === 0 ?
                    <div className="noAuctionFound"><img src="/Barrier.png" width="24" height="24" alt="not found icon" style={{ float: "left", marginRight: "5px" }} /> <p>We couldn't find any tracked flips.</p></div> :
                    <ListGroup className="list">
                        {list}
                    </ListGroup>
            }
        </div>
    )
}