import React, { useEffect, useState } from 'react';
import Search from '../../components/Search/Search';
import PriceGraph from '../../components/PriceGraph/PriceGraph';
import './ItemDetails.css';
import { useParams } from "react-router-dom";
import EnchantmentFilter from '../../components/EnchantmentFilter/EnchantmentFilter';
import { getEnchantmentFilterFromUrl } from '../../utils/Parser/URLParser';
import { useLocation } from "react-router-dom";
import { parseItem } from '../../utils/Parser/APIResponseParser';
import { convertTagToName } from '../../utils/Formatter';
import api from '../../api/ApiHelper';

function ItemDetails() {

    let { tag } = useParams();
    let query = new URLSearchParams(useLocation().search);
    let [enchantmentFilter, setEnchantmentFilter] = useState<EnchantmentFilter>(getEnchantmentFilterFromUrl(query)!);
    let [item, setItem] = useState<Item>();

    useEffect(() => {
        api.getItemImageUrl(getItem()).then(iconUrl => {
            setItem({
                tag: tag,
                name: convertTagToName(tag),
                iconUrl: iconUrl
            });
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tag]);

    let getItem = (): Item => {
        return item || parseItem({
            tag: tag,
            name: convertTagToName(tag)
        })
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
