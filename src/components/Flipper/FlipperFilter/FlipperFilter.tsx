import React, { ChangeEvent, useState } from 'react';
import { Form } from 'react-bootstrap';
import './FlipperFilter.css';

interface Props {
    onChange(filter: FlipperFilter)
}

function FlipperFilter(props: Props) {

    let [onlyBin] = useState(false);
    let [minProfit] = useState(0);

    let onOnlyBinChange = (event: ChangeEvent<HTMLInputElement>) => {
        props.onChange({
            onlyBin: event.target.checked,
            minProfit: minProfit
        });
    }

    
    let onOnlyMinProfitChange = (event: ChangeEvent<HTMLInputElement>) => {
        props.onChange({
            onlyBin: onlyBin,
            minProfit: parseInt(event.target.value)
        });
    }

    return (
        <div>
            <Form style={{ marginBottom: "5px" }} >
                <Form.Group>
                    <div>
                        <Form.Label htmlFor="onlyBinCheckbox" className="flipper-filter-formfield-label only-bin-label">Only BIN-Auctions?</Form.Label>
                        <Form.Check id="onlyBinCheckbox" onChange={onOnlyBinChange} className="flipper-filter-formfield" type="checkbox" />
                    </div>
                </Form.Group>
                <Form.Group>
                    <div>
                        <Form.Label className="flipper-filter-formfield-label">Min Profit:</Form.Label>
                        <Form.Control onChange={onOnlyMinProfitChange} className="flipper-filter-formfield" style={{maxWidth: "300px"}} type="number" />
                    </div>
                </Form.Group>
            </Form >
        </div>
    );
}

export default FlipperFilter;