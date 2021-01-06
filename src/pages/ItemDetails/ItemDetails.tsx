import React, { useEffect, useState } from 'react';
import Search from '../../components/Search/Search';
import Payment from '../../components/Payment/Payment';
import PriceGraph from '../../components/PriceGraph/PriceGraph';
import './ItemDetails.css';
import { useParams } from "react-router-dom";
import EnchantmentFilter from '../../components/EnchantmentFilter/EnchantmentFilter';
import { parseItem } from '../../utils/Parser/APIResponseParser';
import { convertTagToName } from '../../utils/Formatter';
import api from '../../api/ApiHelper';

function ItemDetails() {

    let { tag } = useParams();
    let [enchantmentFilter, setEnchantmentFilter] = useState<EnchantmentFilter>();
    let [item, setItem] = useState<Item>();
    let [itemPriceGraphLoading, setItemPriceGraphLoading] = useState(true);

    useEffect(() => {
        api.getItemImageUrl({ tag: tag }).then(iconUrl => {
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

    let onPriceGraphLoadingChange = (state: boolean) => {
        setItemPriceGraphLoading(state);
    }

    return (
        <div className="item-details">
            <Search selected={getItem()} />
            <Payment />
            <EnchantmentFilter onFilterChange={onEnchantmentFilterChange} disabled={itemPriceGraphLoading} />
            <PriceGraph item={getItem()} enchantmentFilter={enchantmentFilter} onPriceGraphLoadingChange={onPriceGraphLoadingChange} />
        </div >
    );
}

export default ItemDetails;
