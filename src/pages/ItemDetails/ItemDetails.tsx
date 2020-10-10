import React, { useState } from 'react';
import Search from '../../components/Search/Search';
import PriceGraph from '../../components/PriceGraph/PriceGraph';
import './ItemDetails.css';
import { useParams } from "react-router-dom";
import EnchantmentFilter from '../../components/EnchantmentFilter/EnchantmentFilter';

function ItemDetails() {

    let { itemName } = useParams();
    let [enchantmentFilter, setEnchantmentFilter] = useState<EnchantmentFilter>();

    let getItem = (): Item => {
        return {
            name: itemName
        }
    }

    let onEnchantmentFilterChange = (filter: EnchantmentFilter) => {
        setEnchantmentFilter(filter);
    }

    return (
        <div className="item-details">
            <Search selected={getItem()} />
            <EnchantmentFilter onFilterChange={onEnchantmentFilterChange} />
            <PriceGraph item={getItem()} enchantmentFilter={enchantmentFilter} />
        </div >
    );
}

export default ItemDetails;
