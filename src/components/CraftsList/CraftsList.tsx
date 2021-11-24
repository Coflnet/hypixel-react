import React, { ChangeEvent, useEffect, useState } from 'react';
import { Badge, Form, ListGroup } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter';
import './CraftsList.css'
import Tooltip from '../Tooltip/Tooltip';

export function CraftsList() {

    let [crafts, setCrafts] = useState<ProfitableCraft[]>([]);
    let [nameFilter, setNameFilter] = useState<string | null>();
    let [selectFilter, setSelectFilter] = useState<string>("profit");

    useEffect(() => {
        loadCrafts();

    }, []);

    function loadCrafts() {
        api.getProfitableCrafts().then(crafts => {
            setCrafts(crafts);
        })
    }

    function onNameFilterChange(e: any) {
        if (e.target.value) {
            setNameFilter(e.target.value);
        } else {
            setNameFilter(e.target.value);
        }
    }

    function updateSelectFilter(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex;
        let value = event.target.options[selectedIndex].getAttribute('value')!;
        setSelectFilter(value);
    }

    function getListElement(craft: ProfitableCraft) {
        if (nameFilter && craft.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
            return <span />;
        }
        return <ListGroup.Item action className="list-group-item">
            <h4>
                <img crossOrigin="anonymous" src={craft.item.iconUrl} height="32" width="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                {convertTagToName(craft.item.name)}
            </h4>
            <p><span className="label">Crafting-Cost:</span> {numberWithThousandsSeperators(Math.round(craft.craftCost))}</p>
            <p><span className="label">Sell-Price:</span> {numberWithThousandsSeperators(Math.round(craft.sellPrice))}</p>
            <p><span className="label">Req. Collection:</span> {craft.requiredCollection ? convertTagToName(craft.requiredCollection.name) + " " + craft.requiredCollection.level : <span style={{ color: "red" }}>---</span>}</p>
        </ListGroup.Item>
    }

    function getHoverElement(craft: ProfitableCraft) {
        return <div style={{ width: "auto" }}>
            <div style={{ width: "auto", whiteSpace: "nowrap" }}>
                {craft.ingredients.map(ingredient => {
                    return <p key={ingredient.item.tag} style={{ textAlign: "left" }}>
                        <img crossOrigin="anonymous" src={ingredient.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                        {ingredient.item.name + " (" + ingredient.count + "x)"}
                        <Badge style={{ marginLeft: "5px" }} variant="secondary">{numberWithThousandsSeperators(Math.round(ingredient.cost * ingredient.count))}</Badge>
                    </p>
                })}
            </div>
        </div>
    }


    if (selectFilter) {
        if (selectFilter === "profit") {
            crafts = crafts.sort((a, b) => (b.sellPrice - b.craftCost) - (a.sellPrice - a.craftCost));
        } else {
            crafts = crafts.sort((a, b) => (b[selectFilter] as number) - (a[selectFilter] as number));
        }
    }

    let list = crafts.map((craft, i) => {
        return (
            <Tooltip type="hover" id="tooltip-container" content={getListElement(craft)} tooltipContent={getHoverElement(craft)} />
        )
    });


    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Form.Control style={{ width: "49%" }} placeholder="Item name..." onChange={onNameFilterChange} />
                <Form.Control style={{ width: "49%" }} className="select-filter" defaultValue={selectFilter} as="select" onChange={updateSelectFilter}>
                    <option value={""}>-</option>
                    <option value={"craftCost"}>Craft-Cost</option>
                    <option value={"sellPrice"}>Sell-Price</option>
                    <option value={"profit"}>Profit</option>
                </Form.Control>
            </div>
            <hr />
            <div className="crafts-list">
                <ListGroup className="list">
                    {list}
                </ListGroup>
            </div>
        </div>
    )
}