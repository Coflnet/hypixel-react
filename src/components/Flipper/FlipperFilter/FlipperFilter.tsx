import React, { ChangeEvent, useState } from 'react';
import { Form } from 'react-bootstrap';
import './FlipperFilter.css';

interface Props {
    onChange(filter: FlipperFilter)
}

function FlipperFilter(props: Props) {

    let [onlyBin, setOnlyBin] = useState(false);
    let [minProfit, setMinProfit] = useState(0);
    let [maxCost, setMaxCost] = useState<number>();

    let onOnlyBinChange = (event: ChangeEvent<HTMLInputElement>) => {
        setOnlyBin(event.target.checked);
        props.onChange({
            onlyBin: event.target.checked,
            minProfit: minProfit,
            maxCost: maxCost
        });
    }


    let onMinProfitChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMinProfit(parseInt(event.target.value))
        props.onChange({
            onlyBin: onlyBin,
            minProfit: parseInt(event.target.value),
            maxCost: maxCost
        });
    }

    let onMaxCostChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMaxCost(parseInt(event.target.value))
        props.onChange({
            onlyBin: onlyBin,
            minProfit: minProfit,
            maxCost: parseInt(event.target.value),
        });
    }

    return (
        <div>
            <Form style={{ marginBottom: "5px" }} >
                <div>
                    <Form.Group style={{ width: "45%", display: "inline-block" }}>
                        <Form.Label className="flipper-filter-formfield-label">Min Profit:</Form.Label>
                        <Form.Control onChange={onMinProfitChange} className="flipper-filter-formfield" type="number" step={5000} />
                    </Form.Group>
                    <Form.Group style={{ width: "45%", display: "inline-block", marginLeft: "5%" }}>
                        <Form.Label className="flipper-filter-formfield-label">Max Cost:</Form.Label>
                        <Form.Control onChange={onMaxCostChange} className="flipper-filter-formfield" type="number" step={20000} />
                    </Form.Group>
                </div>
                <Form.Group>
                    <Form.Label htmlFor="onlyBinCheckbox" className="flipper-filter-formfield-label only-bin-label">Only BIN-Auctions?</Form.Label>
                    <Form.Check id="onlyBinCheckbox" onChange={onOnlyBinChange} className="flipper-filter-formfield" type="checkbox" />
                </Form.Group>
            </Form >
        </div>
    );
}

export default FlipperFilter;