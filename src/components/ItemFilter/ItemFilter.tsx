/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Form, Modal, Spinner } from 'react-bootstrap';
import './ItemFilter.css';
import { useLocation, useHistory } from "react-router-dom";
import { getItemFilterFromUrl } from '../../utils/Parser/URLParser';
import FilterElement from '../FilterElement/FilterElement';
import { v4 as generateUUID } from 'uuid';
import { AddCircleOutline as AddIcon, Help as HelpIcon } from '@material-ui/icons';
import { Link } from '@material-ui/core';
import api from '../../api/ApiHelper';

interface Props {
    onFilterChange?(filter?: ItemFilter): void,
    disabled?: boolean,
    filters?: string[]
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function ItemFilter(props: Props) {

    const reforgeSelect = useRef(null);

    let [itemFilter, setItemFilter] = useState<ItemFilter>();
    let [expanded, setExpanded] = useState(false);
    let [isApplied, setIsApplied] = useState(false);
    let [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    let [showInfoDialog, setShowInfoDialog] = useState(false);
    let [filterOptions, setFilterOptions] = useState<FilterOptions[]>([]);


    let history = useHistory();
    let query = new URLSearchParams(useLocation().search);

    useEffect(() => {
        mounted = true;
        itemFilter = getItemFilterFromUrl(query);
        if (itemFilter) {
            setExpanded(true);
            Object.keys(itemFilter).forEach(name => enableFilter(name));
            setItemFilter(itemFilter);
            setTimeout(() => {
                onFilterApply();
            }, 1);
        }
        history.listen(() => {
            // also gets called when the timespan is changed
            //setIsApplied(false);
        })
        return () => { mounted = false }
    }, []);

    let loadFilterOptions = (filterName: string) => {
        if (filterOptions.some(el => el.name == filterName)) {
            return;
        }
        api.getFilter(filterName).then(options => {
            if (filterOptions.some(el => el.name == filterName)) {
                return;
            }
            filterOptions.push(options);
            setFilterOptions(filterOptions);
        })
    }

    let enableFilter = (filterName: string) => {
        loadFilterOptions(filterName);

        if (!filterOptions.some(el => el.name == filterName)) {
            setTimeout(() => {
                enableFilter(filterName)
            }, 50);
            return;
        }
        if (selectedFilters.some(n => n == filterName)) {
            return;
        }
        setSelectedFilters([filterName, ...selectedFilters])

        setIsApplied(false);
        updateURLQuery(itemFilter);
        setItemFilter(itemFilter);
    }

    let addFilter = (event: ChangeEvent<HTMLSelectElement>) => {
        let selectedIndex = event.target.options.selectedIndex;
        let filterName = event.target.options[selectedIndex].getAttribute('data-id')!;

        enableFilter(filterName);
    }


    let onFilterApply = () => {
        if (props.onFilterChange) {
            props.onFilterChange(itemFilter);
        }
        setIsApplied(true);
    }

    let onFilterRemove = () => {
        setSelectedFilters([]);
        setExpanded(false);
        setItemFilter(undefined);
        if (props.onFilterChange) {
            props.onFilterChange(undefined);
        }
        updateURLQuery();
    }

    let onEnable = () => {
        setExpanded(true);
        if (!itemFilter) {
            itemFilter = {}
            setItemFilter(itemFilter);
        }
        updateURLQuery(itemFilter);
    }

    let updateURLQuery = (filter?: ItemFilter) => {
        history.push({
            pathname: history.location.pathname,
            search: filter ? '?itemFilter=' + btoa(JSON.stringify(filter)) : ''
        })
    }



    let filterSelectList = props?.filters ? props?.filters.filter(f => !selectedFilters.includes(f)).map(filter => {
        return (
            <option data-id={filter} key={filter} value={filter}>{filter}</option>
        )
    }) : ""

    let onFilterChange = (filter?: ItemFilter) => {
        var keys = Object.keys(filter as object);
        if (keys.length > 0) {
            var key = keys[0];
            itemFilter![key] = filter![key];
        }

        setIsApplied(false);
        updateURLQuery(itemFilter);
        setItemFilter(itemFilter);
    }

    let filterList = selectedFilters.map(filterName => {
        return <div key={filterName} className="filter-element">
            <FilterElement onFilterChange={onFilterChange} options={filterOptions} filterName={filterName} value={itemFilter![filterName]}></FilterElement>
            <div><button className="btn btn-danger remove-filter" onClick={() => removeFilter(filterName)}>remove</button></div></div>
    });

    let infoIconElement = (
        <div>
            <span style={{ cursor: "pointer", position: "absolute", top: "10px", right: "10px", color: "#007bff" }} onClick={() => { setShowInfoDialog(true) }}>
                <HelpIcon />
            </span>
            {
                showInfoDialog ?
                    <Modal show={showInfoDialog} onHide={() => { setShowInfoDialog(false) }}>
                        <Modal.Header closeButton>
                            <h4>Item-Filter Information</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <p>You can add various filters depending on the item type. After clicking 'apply' only the auctions matching your filter will be displayed.</p>
                            <hr />
                            <h4><Badge variant="danger">Caution</Badge></h4>
                            <p>Some filter requests take quite some time to process. Thats because we have to search through millions of auctions that potentially match your filter.</p>
                            <p>If you are missing a filter please ask for it on our <Link href="/feedback">discord</Link></p>
                        </Modal.Body>
                    </Modal> : ""
            }
        </div>
    );

    function removeFilter(filterName: string) {
        if(itemFilter)
        {
            delete itemFilter[filterName];
            setItemFilter(itemFilter);
            updateURLQuery(itemFilter);
        }
        setSelectedFilters(selectedFilters.filter(f => f != filterName))
    }

    return (
        <div className="enchantment-filter">
            {!expanded ?
                <div>
                    <a href="#" onClick={() => onEnable()}>
                        <AddIcon />
                        <span> Add Filter</span>
                    </a>
                </div> :
                <Card>
                    <Card.Title style={{ margin: "10px" }}>
                        Filter
                        {isApplied ?
                            <Badge variant="success" className="appliedBadge">Applied</Badge> :
                            <Badge variant="danger" className="appliedBadge">Filter is currently NOT Applied</Badge>}
                        {infoIconElement}
                    </Card.Title>
                    <Card.Body>

                        <Form inline style={{ marginBottom: "5px" }} >

                            <Form.Group>
                                {props?.filters && props.filters?.length > 0 ?
                                    <div>
                                        <Form.Control className="select-filter" as="select" onChange={addFilter} disabled={props.disabled} ref={reforgeSelect}>
                                            <option>Click to add filter</option>
                                            {filterSelectList}
                                        </Form.Control>
                                    </div> :
                                    <Spinner animation="border" role="status" variant="primary" />
                                }
                            </Form.Group>
                            <div className="filter-container">
                                {filterList}
                            </div>
                        </Form >
                        <div>
                            <Button className="btn-success" style={{ marginRight: "5px" }} onClick={() => onFilterApply()} disabled={props.disabled}>Apply</Button>
                            <Button className="btn-danger" onClick={() => onFilterRemove()} disabled={props.disabled}>Remove Filter</Button>
                        </div>
                    </Card.Body>
                </Card>
            }
        </div >
    )


}

export default ItemFilter;


