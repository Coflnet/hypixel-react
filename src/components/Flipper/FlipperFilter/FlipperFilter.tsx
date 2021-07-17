import React, { ChangeEvent, useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import './FlipperFilter.css';
import Tooltip from '../../Tooltip/Tooltip';
import Countdown, { zeroPad } from 'react-countdown';

interface Props {
    onChange(filter: FlipperFilter),
    isLoggedIn?: boolean,
    isPremium?: boolean
}

let FREE_PREMIUM_SPAN = 1000 * 60 * 6;
let FREE_LOGIN_SPAN = 1000 * 60 * 5;

let FREE_PREMIUM_FILTER_TIME = new Date(new Date().getTime() + FREE_PREMIUM_SPAN);
let FREE_LOGIN_FILTER_TIME = new Date(new Date().getTime() + FREE_LOGIN_SPAN);

function FlipperFilter(props: Props) {

    let [onlyBin, setOnlyBin] = useState(false);
    let [onlyUnsold, setOnlyUnsold] = useState(false);
    let [minProfit, setMinProfit] = useState(0);
    let [maxCost, setMaxCost] = useState<number>();
    let [freePremiumFilters, setFreePremiumFilters] = useState(false);
    let [freeLoginFilters, setFreeLoginFilters] = useState(false);

    useEffect(() => {
        updateOnlyUnsold(props.isPremium == null ? false : props.isPremium);
        props.onChange(getCurrentFilter());

        setTimeout(() => {
            setFreePremiumFilters(true);
        }, FREE_PREMIUM_SPAN)
        setTimeout(() => {
            setFreeLoginFilters(true);
        }, FREE_LOGIN_SPAN)

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
        let isActive = event.target.checked;
        updateOnlyUnsold(isActive);
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

    function updateOnlyUnsold(isActive: boolean) {
        setOnlyUnsold(isActive);
        let filter = getCurrentFilter();
        filter.onlyUnsold = isActive;
        props.onChange(filter);
    }

    const countdownRenderer = ({ minutes, seconds }) => (
        <span>
            {zeroPad(minutes)}:{zeroPad(seconds)}
        </span>
    );

    const nonPremiumTooltip = <span>This is a premium feature.<br />(to use for free wait  <Countdown renderer={countdownRenderer} date={FREE_PREMIUM_FILTER_TIME} />)</span>;
    const nonLoggedInTooltip = <span>Login to use these filters.<br />(or wait  <Countdown renderer={countdownRenderer} date={FREE_LOGIN_FILTER_TIME} />)</span>;

    const binFilter = <Form.Group>
        <Form.Label htmlFor="onlyBinCheckbox" className="flipper-filter-formfield-label only-bin-label">Only BIN-Auctions</Form.Label>
        <Form.Check id="onlyBinCheckbox" onChange={onOnlyBinChange} className="flipper-filter-formfield" type="checkbox" disabled={!props.isPremium && !freePremiumFilters} />

    </Form.Group>;
    const soldFilter = <Form.Group>
        <Form.Label htmlFor="onlyUnsoldCheckbox" className="flipper-filter-formfield-label only-bin-label">Hide SOLD Auctions</Form.Label>
        <Form.Check id="onlyUnsoldCheckbox" onChange={onOnlyUnsoldChange} defaultChecked={props.isPremium} className="flipper-filter-formfield" type="checkbox" disabled={!props.isPremium && !freePremiumFilters} />
    </Form.Group>;

    const numberFilters = <div>
        <Form.Group style={{ width: "45%", display: "inline-block" }}>
            <Form.Label className="flipper-filter-formfield-label">Min Profit:</Form.Label>
            <Form.Control onChange={onMinProfitChange} className="flipper-filter-formfield" type="number" step={5000} disabled={!props.isLoggedIn && !freeLoginFilters} />
        </Form.Group>
        <Form.Group style={{ width: "45%", display: "inline-block", marginLeft: "5%" }}>
            <Form.Label className="flipper-filter-formfield-label">Max Cost:</Form.Label>
            <Form.Control onChange={onMaxCostChange} className="flipper-filter-formfield" type="number" step={20000} disabled={!props.isLoggedIn && !freeLoginFilters} />
        </Form.Group>
    </div>;

    return (
        <div>
            <Form style={{ marginBottom: "5px" }} >
                {!props.isLoggedIn && !freeLoginFilters ?
                    <Tooltip type="hover" content={numberFilters}
                        tooltipContent={nonLoggedInTooltip}
                    /> : numberFilters}
                <div className="premium-filters">
                    {!props.isPremium && !freePremiumFilters ?
                        <Tooltip type="hover" content={binFilter}
                            tooltipContent={nonPremiumTooltip}
                        /> : binFilter}

                    {!props.isPremium && !freePremiumFilters ?
                        <Tooltip type="hover" content={soldFilter}
                            tooltipContent={nonPremiumTooltip}
                        /> : soldFilter}
                </div>


            </Form >
        </div>
    );

}

export default FlipperFilter;