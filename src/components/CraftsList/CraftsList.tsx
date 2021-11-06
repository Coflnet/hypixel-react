import React, { useEffect, useState } from 'react';
import { ListGroup } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter';
import './CraftsList.css'
import Tooltip from '../Tooltip/Tooltip';

export function CraftsList() {

    let [crafts, setCrafts] = useState<ProfitableCraft[]>([]);

    useEffect(() => {
        loadCrafts();
    }, []);

    function loadCrafts() {
        api.getProfitableCrafts().then(crafts => {
            setCrafts(crafts);
        })
    }

    function getListElement(craft: ProfitableCraft) {
        return <ListGroup.Item action className="list-group-item">
            <h4>
                <img crossOrigin="anonymous" src={craft.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                {convertTagToName(craft.item.name)}
            </h4>
            <p>Crafting-Cost: {numberWithThousandsSeperators(craft.craftCost)}</p>
            <p>Sell-Price: {numberWithThousandsSeperators(craft.sellPrice)}</p>
            {craft.requiredCollection
                ? <p>Req. Collection: {craft.requiredCollection.name + " " + craft.requiredCollection.level}</p>
                : null
            }
        </ListGroup.Item>
    }

    function getHoverElement(craft: ProfitableCraft) {
        return <div>
            <ul>
                {craft.ingredients.map(ingredient => {
                    return <li>{ingredient.item.name + "(" + ingredient.count + "x) => " + numberWithThousandsSeperators(ingredient.cost)}</li>
                })}
            </ul>
        </div>
    }

    let list = crafts.map((craft, i) => {
        return (
            <Tooltip type="hover" content={getListElement(craft)} tooltipContent={getHoverElement(craft)} />
        )
    });


    return (
        <div className="crafts-list">
            <ListGroup className="list">
                {list}
            </ListGroup>
        </div>
    )
}