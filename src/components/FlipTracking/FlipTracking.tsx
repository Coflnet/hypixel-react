import React, { useEffect, useState } from 'react';
import { Badge, Card, ListGroup } from 'react-bootstrap';
import { useParams } from 'react-router';
import api from '../../api/ApiHelper';
import { ArrowRightAlt as ArrowRightIcon } from '@material-ui/icons';
import { getStyleForTier, numberWithThousandsSeperators } from '../../utils/Formatter';
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
                <h1 style={{ padding: "10px", display: "flex", justifyContent: "space-between", fontSize: "x-large" }}>
                    <div className="ellipse">
                        <img crossOrigin="anonymous" src={trackedFlip.item.iconUrl} height="36" width="36" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                        <span style={{ ...getStyleForTier(trackedFlip.item.tier), whiteSpace: "nowrap" }}>dsasdfasdfsfasdfasfdasfdasdsfasdfasdasdfasdfsdafasdfdsfsfdsf</span>
                    </div>
                    <span style={{ color: "lime", whiteSpace: "nowrap", marginLeft: "5px" }}>+{numberWithThousandsSeperators(trackedFlip.soldFor - trackedFlip.pricePaid)} Coins</span>
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
                <p style={{ marginTop: "10px" }}>Finder: <Badge variant="dark">{trackedFlip.finder.shortLabel}</Badge></p>
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