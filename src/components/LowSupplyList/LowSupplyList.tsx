import React, { useEffect, useState } from 'react';
import { Badge, ListGroup } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { getLoadingElement } from '../../utils/LoadingUtils';
import './LowSupplyList.css'

interface Props {

}

let mounted = true;

function LowSupplyList(props: Props) {

    let [lowSupplyItems, setLowSupplyItems] = useState<LowSupplyItem[]>();

    useEffect(() => {
        mounted = true;
    })

    useEffect(() => {
        loadLowSupplyItems();
        return () => { mounted = false };
    }, []);

    function loadLowSupplyItems() {
        api.getLowSupplyItems().then(items => {
            if (!mounted) {
                return;
            }
            setLowSupplyItems(items);
        });
    }

    let lowSupplyItemsTableBody = lowSupplyItems ? lowSupplyItems.map((item, i) =>
    (
        <ListGroup.Item key={i}>
            <h5>
                <p className="ellipsis">
                    <img crossOrigin="anonymous" src={item.iconUrl} width="32" height="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                    {item.name}
                </p>
            </h5>
            <p>Supply: <Badge className="supply-badge" variant="success">{item.supply}</Badge></p>
        </ListGroup.Item>)
    ) : []

    return (
        <div className="low-supply-list">{
            !lowSupplyItems ?
                <p>{getLoadingElement(<p>Loading low supply items</p>)}</p> :
                lowSupplyItems.length > 0 ?
                    <ListGroup style={{ marginTop: "20px" }}>
                        {lowSupplyItemsTableBody}
                    </ListGroup> :
                    <p>No low volume items found</p>
        }</div>
    );
}

export default LowSupplyList;