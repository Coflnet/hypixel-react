import React, { ChangeEvent, useState } from 'react';
import { Form } from 'react-bootstrap';
import './FlipperFilter.css';

interface Props {
    onChange(filter: FlipperFilter)
}

function FlipperFilter(props: Props) {

    let [onlyBin, setOnlyBin] = useState(false);
    let [minProfit, setMinProfit] = useState(0);

    let onOnlyBinChange = (event: ChangeEvent<HTMLInputElement>) => {
        setOnlyBin(event.target.checked);
        props.onChange({
            onlyBin: event.target.checked,
            minProfit: minProfit
        });
    }

    
    let onMinProfitChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMinProfit(parseInt(event.target.value))
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
                        <Form.Control onChange={onMinProfitChange} className="flipper-filter-formfield" style={{maxWidth: "300px"}} type="number" />
                    </div>
                </Form.Group>
            </Form >
        </div>
    );
}

export default FlipperFilter;