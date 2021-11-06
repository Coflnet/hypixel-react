import React, { ChangeEvent, useEffect, useState } from 'react';
import { Card, Form, Table } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { getLoadingElement } from '../../utils/LoadingUtils';
import './LowSupplyList.css'
import { ArrowDownward as ArrowDownIcon, ArrowUpward as ArrowUpIcon } from '@material-ui/icons'

let mounted = true;

function LowSupplyList() {

    let [lowSupplyItems, setLowSupplyItems] = useState<LowSupplyItem[]>();
    let [orderBy, setOrderBy] = useState("-supply");
    let [nameFilter, setNameFilter] = useState<string | null>();

    useEffect(() => {
        mounted = true;
        loadLowSupplyItems();
        return () => { mounted = false };
    }, []);

    function loadLowSupplyItems() {
        api.getLowSupplyItems().then(items => {
            if (!mounted) {
                return;
            }
            lowSupplyItems = items;
            onOrderChange(orderBy);
            setLowSupplyItems(items);
        });
    }

    function onSupplyClick() {
        let o = orderBy === "supply" ? "-supply" : "supply";
        onOrderChange(o);
    }

    function onMedianClick() {
        let o = orderBy === "medianPrice" ? "-medianPrice" : "medianPrice";
        onOrderChange(o);
    }

    function onOrderChange(order) {

        if (!lowSupplyItems) {
            return;
        }

        let key = order.startsWith("-") ? order.substring(1) : order;

        let compareFunction = order.startsWith("-") ? (a, b) => a[key] - b[key] : (a, b) => b[key] - a[key];
        let ordered = lowSupplyItems.sort(compareFunction);
        setLowSupplyItems(ordered);
        setOrderBy(order);
    }

    function onNameChange(e: any) {
        if (e.target.value) {
            setNameFilter(e.target.value);
        } else {
            setNameFilter(null);
        }
    }


    let lowSupplyItemsTableBody = lowSupplyItems ? lowSupplyItems.map((item, i) => {
        if (nameFilter && item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
            return "";
        }
        return (
            <tr>
                <td><img crossOrigin="anonymous" src={item.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" /></td>
                <td>{item.name}</td>
                <td>{item.supply}</td>
                <td>{item.medianPrice}</td>
            </tr>)
    }) : []

    return (
        <div className="low-supply-list">{
            !lowSupplyItems ?
                getLoadingElement(<p>Loading low supply items</p>) :
                lowSupplyItems.length > 0 ?
                    <Card>
                        <Table>
                            <thead>
                                <tr>
                                    <th>Icon</th>
                                    <th><Form.Control style={{ width: "auto" }} placeholder="Name" onChange={onNameChange} /></th>
                                    <th style={{ cursor: "pointer" }} onClick={onSupplyClick}>Supply {orderBy === "supply" ? <ArrowDownIcon /> : (orderBy === "-supply" ? <ArrowUpIcon /> : null)}</th>
                                    <th style={{ cursor: "pointer" }} onClick={onMedianClick}>Median price {orderBy === "medianPrice" ? <ArrowDownIcon /> : (orderBy === "-medianPrice" ? <ArrowUpIcon /> : null)}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowSupplyItemsTableBody}
                            </tbody>
                        </Table>
                    </Card> :
                    <p>No low volume items found</p>
        }</div>
    );
}

export default LowSupplyList;