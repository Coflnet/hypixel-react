import React, { useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import './RecentAuctions.css';

interface Props {
    item: Item,
    fetchspan: number,
    itemFilter?: ItemFilter
}

function RecentAuctions(props: Props) {

    let [recentAuctions, setRecentAuctions] = useState<RecentAuction[]>([]);

    useEffect(() => {
        api.getRecentAuctions(props.item.name || props.item.tag, props.fetchspan, props.itemFilter).then(recentAuctions => {
            console.log(recentAuctions);
            setRecentAuctions(recentAuctions);
        })
    }, [props.item, props.fetchspan, props.itemFilter]);

    let recentAuctionList = recentAuctions.map((recentAuction) => {
        return (
            <p>{recentAuction.price}</p>
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