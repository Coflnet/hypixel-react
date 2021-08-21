import React, { useEffect, useState } from 'react';
import { Button, Badge, Card, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import api from '../../../api/ApiHelper';
import { convertTagToName, getStyleForTier } from '../../../utils/Formatter';
import { useForceUpdate } from '../../../utils/Hooks';
import { getSetting, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils';
import ItemFilter from '../../ItemFilter/ItemFilter';
import Search from '../../Search/Search';
import './FlipRestrictionList.css';
import { Delete as DeleteIcon } from '@material-ui/icons';

interface Props {
    onRestrictionsChange(restrictions: FlipRestriction[])
}

function FlipRestrictionList(props: Props) {

    let [newRestriction, setNewRestriction] = useState<FlipRestriction>({ type: "blacklist" })
    let [isAddNewFlipperExtended, setIsNewFlipperExtended] = useState(false);
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>([]);
    let [filters, setFilters] = useState<FilterOptions[]>();

    let forceUpdate = useForceUpdate();

    useEffect(() => {
        loadFilters();
        loadRestrictions();
    }, [])

    function loadRestrictions() {
        let restrictions = getSetting(RESTRICTIONS_SETTINGS_KEY);
        try {
            setRestrictions(JSON.parse(restrictions));
        } catch {
            setRestrictions([]);
        }
    }

    function loadFilters() {
        api.filterFor({ tag: "ASPECT_OF_THE_END" }).then(filters => {
            setFilters(filters);
        })
    }

    function onSearchResultClick(item: SearchResultItem) {
        if (item.type !== "item") {
            return;
        }
        newRestriction.item = (item.dataItem as Item);
        setNewRestriction(newRestriction);
        forceUpdate();
    }

    function onFilterChange(filter: ItemFilter) {
        let restriction = newRestriction;
        restriction.itemFilter = filter;
        setNewRestriction(restriction);
    }

    function addNewRestriction() {
        restrictions.push(newRestriction);

        let restriction: FlipRestriction = { type: "blacklist" };
        setNewRestriction(restriction);
        setIsNewFlipperExtended(false);

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(restrictions));

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(restrictions);
        }

        forceUpdate();
    }

    function onNewRestrictionCancel() {
        let restriction: FlipRestriction = { type: "blacklist" };
        setNewRestriction(restriction);
        setIsNewFlipperExtended(false);
    }

    function onRestrictionTypeChange(value) {
        let restriction = newRestriction;
        restriction.type = value;
        setNewRestriction(restriction);
        forceUpdate();
    }

    let getButtonVariant = (range: string): string => {
        return range === newRestriction.type ? "primary" : "secondary";
    }

    /**
     * TODO: Implement whitelist & filter
        <ToggleButtonGroup style={{ maxWidth: "200px" }} className="item-price-range" type="radio" name="options" value={newRestriction.type} onChange={onRestrictionTypeChange}>
            <ToggleButton className="price-range-button" value={"blacklist"} variant={getButtonVariant("blacklist")} size="sm">Blacklist</ToggleButton>
            <ToggleButton className="price-range-button" value={"whitelist"} variant={getButtonVariant("whitelist")} size="sm">Whitelist</ToggleButton>
        </ToggleButtonGroup>

        <ItemFilter filters={filters} forceOpen={true} onFilterChange={onFilterChange} ignoreURL={true} />
     */
    function getNewRestrictionElement() {
        return (
            <div>
                <Search selected={newRestriction.item} backgroundColor="#404040" searchFunction={api.itemSearch} onSearchresultClick={onSearchResultClick} hideNavbar={true} placeholder="Search item" />
                <span>
                    <Button variant="success" onClick={addNewRestriction}>
                        Save new restriction
                    </Button>
                    <Button variant="error" onClick={onNewRestrictionCancel}>
                        Cancel
                    </Button>
                </span>
            </div>
        )
    }

    function removeRestrictionByIndex(index: number) {
        restrictions.splice(index, 1);
        setRestrictions(restrictions);

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(restrictions));

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(restrictions);
        }

        forceUpdate();
    }

    let addIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
    );

    return (
        <div className="flip-restriction-list">
            {
                isAddNewFlipperExtended ? getNewRestrictionElement() : <span style={{cursor: "pointer"}} onClick={() => setIsNewFlipperExtended(true)}>
                    {addIcon}
                    <span> Add new restriction</span>
                </span>
            }
            <hr />
            <div className="restriction-list">
                {
                    restrictions.map((restriction, index) => {
                        return (
                            <Card key={index} className="restriction">
                                <Card.Header style={{ padding: "10px", display: "flex", justifyContent: "space-between" }}>
                                    <Badge style={{ marginRight: "10px" }} variant={restriction.type === "blacklist" ? "danger" : "success"}>{restriction.type.toUpperCase()}</Badge>
                                    {
                                        restriction.item ?
                                            <div className="ellipse" style={{ width: "-webkit-fill-available", float: "left" }}>
                                                <img crossOrigin="anonymous" src={restriction.item?.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                                                <span style={getStyleForTier(restriction.item?.tier)}>{restriction.item?.name}</span>
                                            </div> : ""
                                    }
                                    <div className="remove-filter" onClick={() => removeRestrictionByIndex(index)}>
                                        <DeleteIcon color="error" />
                                    </div>
                                </Card.Header>
                                {
                                    restriction.itemFilter ?
                                        <Card.Body>
                                            {
                                                Object.keys(restriction.itemFilter).map(key => {
                                                    if (!restriction.itemFilter || !restriction.itemFilter[key]) {
                                                        return "";
                                                    }
                                                    return <p key={key}>{convertTagToName(key)}: {restriction.itemFilter[key]}</p>
                                                })
                                            }
                                        </Card.Body> : ""
                                }
                            </Card>
                        )
                    })
                }
            </div>
        </div>
    );
}

export default FlipRestrictionList;