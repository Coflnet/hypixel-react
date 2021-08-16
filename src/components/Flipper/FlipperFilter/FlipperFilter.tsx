import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import './FlipperFilter.css';
import Tooltip from '../../Tooltip/Tooltip';
import Countdown, { zeroPad } from 'react-countdown';
import { v4 as generateUUID } from 'uuid';
import AutoNumeric from 'autonumeric';

interface Props {
    onChange(filter: FlipperFilter),
    isLoggedIn?: boolean,
    isPremium?: boolean
}

let FREE_PREMIUM_SPAN = 1000 * 60 * 5;
let FREE_LOGIN_SPAN = 1000 * 60 * 6;

let FREE_PREMIUM_FILTER_TIME = new Date().getTime() + FREE_PREMIUM_SPAN;
let FREE_LOGIN_FILTER_TIME = new Date().getTime() + FREE_LOGIN_SPAN;

function FlipperFilter(props: Props) {

    let [onlyBin, setOnlyBin] = useState(false);
    let [onlyUnsold, setOnlyUnsold] = useState(props.isPremium);
    let [minProfit, setMinProfit] = useState(0);
    let [minVolume, setMinVolume] = useState(0);
    let [maxCost, setMaxCost] = useState<number>();
    let [freePremiumFilters, setFreePremiumFilters] = useState(false);
    let [freeLoginFilters, setFreeLoginFilters] = useState(false);
    let [uuids, setUUIDs] = useState<string[]>([]);

    let onlyUnsoldRef = useRef(null);

    useEffect(() => {

        let newUuids: string[] = [];
        for (let index = 0; index < 10; index++) {
            newUuids.push(generateUUID())
        }
        setUUIDs(newUuids);

        updateOnlyUnsold(props.isPremium == null ? false : props.isPremium);
        props.onChange(getCurrentFilter());
        FREE_PREMIUM_FILTER_TIME = new Date().getTime() + FREE_PREMIUM_SPAN;
        FREE_LOGIN_FILTER_TIME = new Date().getTime() + FREE_LOGIN_SPAN;

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    checkAutoNumeric();

    function checkAutoNumeric() {

        let autoNumericElementsIds = ['filter-input-min-profit', 'filter-input-min-volume', 'filter-input-max-cost']

        autoNumericElementsIds.forEach(autoNumericElementId => {
            let element = document.getElementById(autoNumericElementId);
            if (element && !AutoNumeric.isManagedByAutoNumeric(element)) {
                new AutoNumeric('#' + autoNumericElementId, 0, {
                    digitGroupSeparator: '.',
                    decimalCharacter: ',',
                    decimalPlaces: 0,
                    emptyInputBehavior: 'zero'
                });
            }
        });
    }

    useEffect(() => {
        if (onlyUnsoldRef.current) {
            let checked = (onlyUnsoldRef.current! as HTMLInputElement).checked;
            setOnlyUnsold(checked);
            onlyUnsold = checked;
            props.onChange(getCurrentFilter());
        }
    }, [props.isPremium])

    let getCurrentFilter = (): FlipperFilter => {
        return {
            onlyBin: onlyBin,
            minProfit: minProfit,
            maxCost: maxCost,
            onlyUnsold: onlyUnsold,
            minVolume: minVolume
        }
    }

    function onOnlyBinChange(event: ChangeEvent<HTMLInputElement>) {
        setOnlyBin(event.target.checked);
        let filter = getCurrentFilter();
        filter.onlyBin = event.target.checked;
        props.onChange(filter);
    }

    function onOnlyUnsoldChange(event: ChangeEvent<HTMLInputElement>) {
        let isActive = event.target.checked;
        updateOnlyUnsold(isActive);
    }

    function onMinProfitChange(event: ChangeEvent<HTMLInputElement>) {

        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
        setMinProfit(val)
        let filter = getCurrentFilter();
        filter.minProfit = val;
        props.onChange(filter);
    }

    function onMaxCostChange(event: ChangeEvent<HTMLInputElement>) {
        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
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

    function onMinVolumeChange(event: ChangeEvent<HTMLInputElement>) {
        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
        setMinVolume(val)
        let filter = getCurrentFilter();
        filter.minVolume = val;
        props.onChange(filter);
    }

    function onFreePremiumComplete() {
        setFreePremiumFilters(true)
    }

    function onFreeLoginComplete() {
        setFreeLoginFilters(true);
    }

    const countdownRenderer = ({ minutes, seconds }) => (
        <span>
            {zeroPad(minutes)}:{zeroPad(seconds)}
        </span>
    );

    const nonPremiumTooltip = <span key="nonPremiumTooltip">This is a premium feature.<br />(to use for free wait  <Countdown key={uuids[0]} date={FREE_PREMIUM_FILTER_TIME} renderer={countdownRenderer} />)</span>;
    const nonLoggedInTooltip = <span key="nonLoggedInTooltip">Login to use these filters.<br />(or wait  <Countdown key={uuids[1]} date={FREE_LOGIN_FILTER_TIME} renderer={countdownRenderer} />)</span>;

    const binFilter = <Form.Group>
        <Form.Label htmlFor="onlyBinCheckbox" className="flipper-filter-formfield-label only-bin-label">Only BIN-Auctions</Form.Label>
        <Form.Check id="onlyBinCheckbox" onChange={onOnlyBinChange} className="flipper-filter-formfield" type="checkbox" disabled={!props.isPremium && !freePremiumFilters} />

    </Form.Group>;
    const soldFilter = <Form.Group>
        <Form.Label htmlFor="onlyUnsoldCheckbox" className="flipper-filter-formfield-label only-bin-label">Hide SOLD Auctions</Form.Label>
        <Form.Check ref={onlyUnsoldRef} id="onlyUnsoldCheckbox" onChange={onOnlyUnsoldChange} defaultChecked={props.isPremium} className="flipper-filter-formfield" type="checkbox" disabled={!props.isPremium && !freePremiumFilters} />
    </Form.Group>;

    const numberFilters = <div style={{ display: "flex", alignContent: "center", justifyContent: "flex-start" }}>
        <Form.Group className="filterTextfield">
            <Form.Label className="flipper-filter-formfield-label">Min. Profit:</Form.Label>
            <Form.Control id="filter-input-min-profit" key="filter-input-min-profit" onChange={onMinProfitChange} className="flipper-filter-formfield" type="text" disabled={!props.isLoggedIn && !freeLoginFilters} />
        </Form.Group>
        <Form.Group className="filterTextfield">
            <Form.Label className="flipper-filter-formfield-label">Min. Volume:</Form.Label>
            <Form.Control id="filter-input-min-volume" key="filter-input-min-volume" onChange={onMinVolumeChange} className="flipper-filter-formfield" disabled={!props.isLoggedIn && !freeLoginFilters} />
        </Form.Group>
        <Form.Group className="filterTextfield">
            <Form.Label className="flipper-filter-formfield-label">Max. Cost:</Form.Label>
            <Form.Control id="filter-input-max-cost" key="filter-input-max-cost" onChange={onMaxCostChange} className="flipper-filter-formfield" disabled={!props.isLoggedIn && !freeLoginFilters} />
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

                <div style={{ visibility: "hidden", height: 0 }}>
                    <Countdown key={uuids[2]} onComplete={onFreePremiumComplete} date={FREE_PREMIUM_FILTER_TIME} />
                    <Countdown key={uuids[3]} onComplete={onFreeLoginComplete} date={FREE_LOGIN_FILTER_TIME} />
                </div>

            </Form >
        </div>
    );

}

export default FlipperFilter;