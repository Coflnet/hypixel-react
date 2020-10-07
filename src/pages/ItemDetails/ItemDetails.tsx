import React, { useState } from 'react';
import Search from '../../components/Search/Search';
import PriceGraph from '../PriceGraph/PriceGraph';
import './ItemDetails.css';

function ItemDetails() {

    let [item] = useState<Item>({
        name: "Diamond Sword",
    });

    return (
        <div className="item-details">
            <Search />
            <PriceGraph item={item} fetchStart={new Date(new Date().setDate(new Date().getDate() - 7))} />
            <h1>ItemDetails</h1>
        </div >
    );
}

export default ItemDetails;
