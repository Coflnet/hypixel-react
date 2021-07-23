/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { Link } from 'react-router-dom';
import { getLoadingElement } from '../../utils/LoadingUtils';

interface Props {
    item: Item,
    filter?: ItemFilter
}

let currentLoad;

function ActiveAuctions(props: Props) {

    let [activeAuctions, setActiveAuctions] = useState<RecentAuction[]>([]);
    let [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadActiveAuctions(props.item, props.filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag, JSON.stringify(props.filter)]);

    function loadActiveAuctions(item: Item, filter?: ItemFilter) {
        setIsLoading(true);
        var filterString = JSON.stringify({
            item,
            filter
        });
        currentLoad = filterString;
        api.getActiveAuctions(item, filter).then(auctions => {
            if (currentLoad !== filterString) {
                return;
            }
            setIsLoading(false);
            setActiveAuctions(auctions);
        }).catch(() => {
            setIsLoading(false);
            setActiveAuctions([]);
        })
    }

    let recentAuctionList = activeAuctions.map((recentAuction) => {
        return (
            <div className="cardWrapper" key={recentAuction.uuid}>
                <Link className="disable-link-style" to={`/auction/${recentAuction.uuid}`}>
                    <Card className="card">
                        <Card.Header style={{ padding: "10px" }}>
                            <div style={{ float: "left" }}>
                                <img crossOrigin="anonymous" className="player-head-icon" src={props.item.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                            </div>
                            <div>
                                {numberWithThousandsSeperators(recentAuction.price)} Coins
                            </div>
                        </Card.Header>
                        <Card.Body style={{ padding: "10px" }}>
                            <img style={{ marginRight: "15px" }} crossOrigin="anonymous" className="player-head-icon" src={recentAuction.seller.iconUrl} alt="" height="24" width="24" loading="lazy" />
                            <span>{recentAuction.playerName}</span>
                            <hr />
                            <p>{'ended ' + moment(recentAuction.end).fromNow()}</p>
                        </Card.Body>
                    </Card>
                </Link>
            </div>
        )
    });

    return (
        <div className="recent-auctions">
            <div className="recent-auctions-list">
                {isLoading ?
                    <div style={{marginTop: "20px"}}>{getLoadingElement()}</div> :
                    activeAuctions.length > 0 ?
                        recentAuctionList :
                        <p style={{ textAlign: "center" }}>No recent auctions found</p>}
            </div>
        </div >
    );
}

export default ActiveAuctions
