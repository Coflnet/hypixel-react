import React from 'react';
import Search from '../../components/Search/Search';
import PriceGraph from '../PriceGraph/PriceGraph';
import './ItemDetails.css';
import { useParams } from "react-router-dom";

function ItemDetails() {

    let { itemName } = useParams();

    let getItem = (): Item => {
        return {
            name: itemName
        }
    }

    return (
        <div className="item-details">
            <Search selected={getItem()} />
            <PriceGraph item={getItem()} fetchStart={new Date(new Date().setDate(new Date().getDate() - 7))} />
            <p>{itemName}</p>
            <h1>ItemDetails</h1>
        </div >
    );
}

export default ItemDetails;
