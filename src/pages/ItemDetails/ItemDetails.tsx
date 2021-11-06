import React, { useEffect, useState } from 'react';
import Search from '../../components/Search/Search';
import PriceGraph from '../../components/PriceGraph/PriceGraph';
import './ItemDetails.css';
import { useParams } from "react-router-dom";
import { parseItem } from '../../utils/Parser/APIResponseParser';
import { convertTagToName } from '../../utils/Formatter';
import api from '../../api/ApiHelper';
import { Container } from 'react-bootstrap';

function ItemDetails() {

    let { tag } = useParams();
    let [item, setItem] = useState<Item>();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [])

    useEffect(() => {
        api.getItemDetails(tag).then(detailedItem => {
            document.title = `Auction Price tracker for ${detailedItem.name || convertTagToName(tag)} in hypixel skyblock`;
            detailedItem.iconUrl = api.getItemImageUrl({ tag: tag });
            setItem(detailedItem);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tag]);

    let getItem = (): Item => {
        return item || parseItem({
            tag: tag,
            name: convertTagToName(tag)
        })
    }

    return (
        <div className="item-details">
            <Container>
                <Search selected={getItem()} />
                <PriceGraph item={getItem()} />
            </Container>
        </div >
    );
}

export default ItemDetails;
