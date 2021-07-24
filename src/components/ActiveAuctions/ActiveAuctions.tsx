/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from 'moment';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Card, Form } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import { Link } from 'react-router-dom';
import { getLoadingElement } from '../../utils/LoadingUtils';

interface Props {
    item: Item,
    filter?: ItemFilter
}

const ORDERS = [
    { label: "Highest price", value: 1 },
    { label: "Lowest price", value: 2 },
    { label: "Ending soon", value: 4 }
];

let currentLoad;

function ActiveAuctions(props: Props) {

    let [activeAuctions, setActiveAuctions] = useState<RecentAuction[]>([]);
    let [isLoading, setIsLoading] = useState(true);
    let [order, setOrder] = useState<number>(1);

    useEffect(() => {
        loadActiveAuctions(props.item, order, props.filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag, JSON.stringify(props.filter), order]);

    function loadActiveAuctions(item: Item, order: number, filter?: ItemFilter) {
        setIsLoading(true);
        var filterString = JSON.stringify({
            item,
            filter
        });
        currentLoad = filterString;
        api.getActiveAuctions(item, order, filter).then(auctions => {
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

    let onOrderChange = (event: ChangeEvent<HTMLSelectElement>) => {
        let selectedIndex = event.target.options.selectedIndex;
        let order = event.target.options[selectedIndex].getAttribute('data-id')!;

        setOrder(parseInt(order));
    }

    let activeAuctionList = activeAuctions.map((activeAuction) => {
        return (
            <div className="cardWrapper" key={activeAuction.uuid}>
                <Link className="disable-link-style" to={`/auction/${activeAuction.uuid}`}>
                    <Card className="card">
                        <Card.Header style={{ padding: "10px" }}>
                            <div style={{ float: "left" }}>
                                <img crossOrigin="anonymous" className="player-head-icon" src={props.item.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                            </div>
                            <div>
                                {numberWithThousandsSeperators(activeAuction.price)} Coins
                            </div>
                        </Card.Header>
                        <Card.Body style={{ padding: "10px" }}>
                            <img style={{ marginRight: "15px" }} crossOrigin="anonymous" className="player-head-icon" src={activeAuction.seller.iconUrl} alt="" height="24" width="24" loading="lazy" />
                            <span>{activeAuction.playerName}</span>
                            <hr />
                            <p>{'ends ' + moment(activeAuction.end).fromNow()}</p>
                        </Card.Body>
                    </Card>
                </Link>
            </div>
        )
    });

    let orderListElement = ORDERS.map(order => {
        return <option key={order.value} value={order.value} data-id={order.value}>{order.label}</option>
    });

    return (
        <div className="recent-auctions">
            <div className="recent-auctions-list">
                <div style={{ margin: "20px" }}>
                    <Form.Control as="select" value={order} onChange={onOrderChange}>
                        <option>Click to set order</option>
                        {orderListElement}
                    </Form.Control>
                </div>
                {isLoading ?
                    <div style={{ marginTop: "20px" }}>{getLoadingElement()}</div> :
                    activeAuctions.length > 0 ?
                        activeAuctionList :
                        <p style={{ textAlign: "center" }}>No recent auctions found</p>}
            </div>
        </div >
    );
}

export default ActiveAuctions
