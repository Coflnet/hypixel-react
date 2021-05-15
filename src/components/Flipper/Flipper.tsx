import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import './Flipper.css';
import { Link } from 'react-router-dom';
import { numberWithThousandsSeperators } from '../../utils/Formatter';

function Flipper() {

    let [flipAuctions, setFlipAuctions] = useState<FlipAuction[]>([]);

    useEffect(() => {
        api.getFlips().then(flips => {
            console.log(flips);
            setFlipAuctions(flips);
        })
    }, [])

    api.subscribeFlips(function(newFipAuction){
        setFlipAuctions([newFipAuction, ...flipAuctions]);
    })

    let flipperAuctionListElement = flipAuctions.map((flipAuction) => {
        return (
            <div className="cardWrapper" key={flipAuction.uuid}>
                <Link to={`/auction/${flipAuction.uuid}`}>
                    <Card className="card" style={{minHeight: "20vh"}}>
                        <Card.Header style={{ padding: "10px" }}>
                            <span>{flipAuction.name}</span>
                        </Card.Header>
                        <Card.Body style={{ padding: "10px" }}>
                            <p>
                                <span className="card-label">Price: </span>
                                <span>{numberWithThousandsSeperators(flipAuction.cost)} Coins</span>
                            </p>
                            <p>
                                <span className="card-label">Sell price: </span>
                                <span style={{ color: "red" }}>{numberWithThousandsSeperators(flipAuction.median)} Coins</span>
                            </p>
                            <p>
                                <span className="card-label">Predicted Profit: </span>
                                <span style={{ color: "green" }}>+{numberWithThousandsSeperators(flipAuction.median - flipAuction.cost)} Coins</span>
                            </p>
                            <br/>
                            <hr style={{marginTop: 0}}/>
                            <p>
                                <span className="card-label">Volume: </span>
                                {flipAuction.volume > 59 ? ">60" : "~" + Math.round(flipAuction.volume * 10) / 10} per Day
                            </p>
                        </Card.Body>
                    </Card>
                </Link>
            </div>
        )
    });

    return (
        <div className="flipper">
            {flipperAuctionListElement}
        </div >
    );
}

export default Flipper;
