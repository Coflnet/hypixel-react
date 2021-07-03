import React, { ChangeEvent, useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import './FlipperFilter.css';

interface Props {
    onChange(filter: FlipperFilter)
}

function FlipperFilter(props: Props) {

    let [onlyBin, setOnlyBin] = useState(false);
    let [onlyUnsold, setOnlyUnsold] = useState(true);
    let [minProfit, setMinProfit] = useState(0);
    let [maxCost, setMaxCost] = useState<number>();

    useEffect(() => {
        props.onChange(getCurrentFilter());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    let getCurrentFilter = (): FlipperFilter => {
        return {
            onlyBin: onlyBin,
            minProfit: minProfit,
            maxCost: maxCost,
            onlyUnsold: onlyUnsold
        }
    }

    let onOnlyBinChange = (event: ChangeEvent<HTMLInputElement>) => {
        setOnlyBin(event.target.checked);
        let filter = getCurrentFilter();
        filter.onlyBin = event.target.checked;
        props.onChange(filter);
    }

    let onOnlyUnsoldChange = (event: ChangeEvent<HTMLInputElement>) => {
        setOnlyUnsold(event.target.checked);
        let filter = getCurrentFilter();
        filter.onlyUnsold = event.target.checked;
        props.onChange(filter);
    }

    let onMinProfitChange = (event: ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(event.target.value);
        setMinProfit(val)
        let filter = getCurrentFilter();
        filter.minProfit = val;
        props.onChange(filter);
    }

    let onMaxCostChange = (event: ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(event.target.value);
        setMaxCost(val)
        let filter = getCurrentFilter();
        filter.maxCost = val;
        props.onChange(filter);
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
                <Form.Group>
                    <Form.Label htmlFor="onlyUnsoldCheckbox" className="flipper-filter-formfield-label only-bin-label">Only running Auctions?</Form.Label>
                    <Form.Check id="onlyUnsoldCheckbox" onChange={onOnlyUnsoldChange} defaultChecked={true} className="flipper-filter-formfield" type="checkbox" />
                </Form.Group>
            </Form >
        </div>
    );
}

export default FlipperFilter;