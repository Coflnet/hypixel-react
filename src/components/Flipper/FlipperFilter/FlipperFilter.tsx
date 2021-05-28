import React, { ChangeEvent, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import './FlipperFilter.css';

interface Props {
    onChange: Function
}

function FlipperFilter(props: Props) {

    let [onlyBin, setOnlyBin] = useState(false);
    let [minProfit, setMinProfit] = useState(0);

    let onOnlyBinChange = (event: ChangeEvent<HTMLInputElement>) => {
        props.onChange({
            onlyBin: event.target.checked,
            minProfit: minProfit
        });
    }

    
    let onOnlyMinProfitChange = (event: ChangeEvent<HTMLInputElement>) => {
        props.onChange({
            onlyBin: onlyBin,
            minProfit: event.target.value
        });
    }

    return (
        <div>
            <Form style={{ marginBottom: "5px" }} >
                <Form.Group>
                    <div>
                        <Form.Label htmlFor="onlyBinCheckbox" className="flipper-filter-formfield-label">Only BIN-Auctions?:</Form.Label>
                        <Form.Check id="onlyBinCheckbox" onChange={onOnlyBinChange} className="flipper-filter-formfield" type="checkbox" />
                    </div>
                </Form.Group>
                <Form.Group>
                    <div>
                        <Form.Label className="flipper-filter-formfield-label">Min Profit?:</Form.Label>
                        <Form.Control onChange={onOnlyMinProfitChange} className="flipper-filter-formfield" style={{maxWidth: "300px"}} type="number" />
                    </div>
                </Form.Group>
            </Form >
        </div>
    );
}

export default FlipperFilter;