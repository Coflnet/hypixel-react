import React, { useEffect, useState } from 'react';
import Search from '../../components/Search/Search';
import PriceGraph from '../../components/PriceGraph/PriceGraph';
import './ItemDetails.css';
import { useParams } from "react-router-dom";
import EnchantmentFilter from '../../components/EnchantmentFilter/EnchantmentFilter';
import { getEnchantmentFilterFromUrl } from '../../utils/Parser/URLParser';
import { useLocation } from "react-router-dom";

function ItemDetails() {

    let { tag } = useParams();
    let query = new URLSearchParams(useLocation().search);
    let [enchantmentFilter, setEnchantmentFilter] = useState<EnchantmentFilter>(getEnchantmentFilterFromUrl(query)!);

    let getItem = (): Item => {
        return {
            tag: tag
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
