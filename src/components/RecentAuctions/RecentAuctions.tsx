import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import './RecentAuctions.css';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { useHistory } from "react-router-dom";
import moment from 'moment';
interface Props {
    item: Item,
    fetchspan: number,
    itemFilter?: ItemFilter
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function RecentAuctions(props: Props) {

    let [recentAuctions, setRecentAuctions] = useState<RecentAuction[]>([]);
    let history = useHistory();

    useEffect(() => {
        mounted = true;
    })

    useEffect(() => {
        api.getRecentAuctions(props.item.tag, props.fetchspan, props.itemFilter).then(recentAuctions => {
            let requests: Promise<string>[] = [];
            recentAuctions.forEach(auction => {
                requests.push(api.getPlayerName(auction.seller.uuid));
            })
            Promise.all(requests).then(results => {
                recentAuctions.forEach((auction, i) => {
                    auction.seller.name = results[i];
                });
                setRecentAuctions(recentAuctions);
            });
        })

        return () => {
            mounted = false;
        };
    }, [props.item, props.fetchspan, props.itemFilter]);

    function onCardClick(uuid){
        history.push({
            pathname: `/auction/${uuid}`
        })
    }

    let recentAuctionList = recentAuctions.map((recentAuction) => {
        return (
            <div className="cardWrapper col-6" key={recentAuction.uuid}>
                <Card className="card" onClick={() => {onCardClick(recentAuction.uuid)}}>
                    <Card.Header style={{ padding: "10px" }}>
                        <div style={{ float: "left" }}>
                            <img crossOrigin="anonymous" src={props.item.iconUrl} width="24" height="24" alt="" style={{ marginRight: "5px" }} />
                        </div>
                        <div>
                            {numberWithThousandsSeperators(recentAuction.price)} Coins
                        </div>
                    </Card.Header>
                    <Card.Body style={{ padding: "10px" }}>
                            <span style={{marginRight: "15px"}}>{recentAuction.seller.name}</span>
                            <img crossOrigin="anonymous" src={recentAuction.seller.iconUrl} alt="" height="24" width="24" />
                            <hr/>
                            <p>{'ended ' + moment(recentAuction.end).fromNow()}</p>
                    </Card.Body>
                </Card>
            </div>
        )
    });

    return (
        <div className="recent-auctions">
            {
                recentAuctionList
            }
        </div >
    );
}

export default RecentAuctions;