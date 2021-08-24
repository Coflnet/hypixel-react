import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Form, Modal } from 'react-bootstrap';
import './FlipperFilter.css';
import Tooltip from '../../Tooltip/Tooltip';
import Countdown, { zeroPad } from 'react-countdown';
import { v4 as generateUUID } from 'uuid';
import FlipRestrictionList from '../FlipRestrictionList/FlipRestrictionList';
import { BallotOutlined as FilterIcon } from '@material-ui/icons';
import AutoNumeric from 'autonumeric';
import { FLIPPER_FILTER_KEY, getSetting, setSetting } from '../../../utils/SettingsUtils';

interface Props {
    onChange(filter: FlipperFilter),
    isLoggedIn?: boolean,
    isPremium?: boolean
}

let FREE_PREMIUM_SPAN = 1000 * 60 * 5;
let FREE_LOGIN_SPAN = 1000 * 60 * 6;

let FREE_PREMIUM_FILTER_TIME = new Date().getTime() + FREE_PREMIUM_SPAN;
let FREE_LOGIN_FILTER_TIME = new Date().getTime() + FREE_LOGIN_SPAN;

let defaultFilter: FlipperFilter;

function FlipperFilter(props: Props) {

    if (!defaultFilter) {
        defaultFilter = loadDefaultFilter();
    }

    let [onlyBin, setOnlyBin] = useState(defaultFilter.onlyBin);
    let [onlyUnsold, setOnlyUnsold] = useState(defaultFilter.onlyUnsold);
    let [minProfit, setMinProfit] = useState(defaultFilter.minProfit);
    let [minVolume, setMinVolume] = useState(defaultFilter.minVolume);
    let [maxCost, setMaxCost] = useState<number>(defaultFilter.maxCost || 0);
    let [freePremiumFilters, setFreePremiumFilters] = useState(false);
    let [freeLoginFilters, setFreeLoginFilters] = useState(false);
    let [uuids, setUUIDs] = useState<string[]>([]);
    let [showRestrictionList, setShowRestrictionList] = useState(false);

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

    function loadDefaultFilter(): FlipperFilter {
        let filter = getSetting(FLIPPER_FILTER_KEY);
        let parsed: FlipperFilter = {};
        try {
            parsed = JSON.parse(filter);
        } catch {
            // to nothing as the filters are correctly initialized 
        }
        return parsed;
    }

    function checkAutoNumeric() {

        let autoNumericElements = [{
            id: 'filter-input-min-profit',
            stateName: 'minProfit'
        }, {
            id: 'filter-input-min-volume',
            stateName: 'minVolume'
        }, {
            id: 'filter-input-max-cost',
            stateName: 'maxCost'
        }]

        autoNumericElements.forEach(autoNumericElement => {
            let element = document.getElementById(autoNumericElement.id);
            if (element && !AutoNumeric.isManagedByAutoNumeric(element)) {

                new AutoNumeric('#' + autoNumericElement.id, defaultFilter[autoNumericElement.stateName], {
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

    function getCurrentFilter(): FlipperFilter {
        return {
            onlyBin: onlyBin,
            minProfit: minProfit,
            maxCost: maxCost,
            onlyUnsold: onlyUnsold,
            minVolume: minVolume
        }
    }

    function onFilterChange(filter: FlipperFilter) {

        if (props.isLoggedIn) {
            let filterToSave = JSON.parse(JSON.stringify(filter));
            if (!props.isPremium) {
                filterToSave.onlyBin = undefined;
                filterToSave.onlyUnsold = undefined;
            }

            setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter));
        } else {
            setSetting(FLIPPER_FILTER_KEY, JSON.stringify({}));
        }

        props.onChange(filter);
    }

    function onOnlyBinChange(event: ChangeEvent<HTMLInputElement>) {
        setOnlyBin(event.target.checked);
        let filter = getCurrentFilter();
        filter.onlyBin = event.target.checked;
        onFilterChange(filter);
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
        onFilterChange(filter);
    }

    function onMaxCostChange(event: ChangeEvent<HTMLInputElement>) {
        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
        setMaxCost(val)
        let filter = getCurrentFilter();
        filter.maxCost = val;
        onFilterChange(filter);
    }

    function updateOnlyUnsold(isActive: boolean) {
        setOnlyUnsold(isActive);
        let filter = getCurrentFilter();
        filter.onlyUnsold = isActive;
        onFilterChange(filter);
    }

    function onMinVolumeChange(event: ChangeEvent<HTMLInputElement>) {
        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
        setMinVolume(val)
        let filter = getCurrentFilter();
        filter.minVolume = val;
        onFilterChange(filter);
    }

    function onRestrictionsChange(restrictions: FlipRestriction[]) {
        let filter = getCurrentFilter();
        filter.restrictions = restrictions;
        onFilterChange(filter);
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


    let restrictionListDialog = (
        <Modal size={"xl"} show={showRestrictionList} onHide={() => { setShowRestrictionList(false) }}>
            <Modal.Header closeButton>
                <Modal.Title>Restrict the flip results</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FlipRestrictionList onRestrictionsChange={onRestrictionsChange} />
            </Modal.Body>
        </Modal>
    );

    const nonPremiumTooltip = <span key="nonPremiumTooltip">This is a premium feature.<br />(to use for free wait  <Countdown key={uuids[0]} date={FREE_PREMIUM_FILTER_TIME} renderer={countdownRenderer} />)</span>;
    const nonLoggedInTooltip = <span key="nonLoggedInTooltip">Login to use these filters.<br />(or wait  <Countdown key={uuids[1]} date={FREE_LOGIN_FILTER_TIME} renderer={countdownRenderer} />)</span>;

    const binFilter = <Form.Group>
        <Form.Label htmlFor="onlyBinCheckbox" className="flipper-filter-formfield-label only-bin-label">Only BIN-Auctions</Form.Label>
        <Form.Check id="onlyBinCheckbox" onChange={onOnlyBinChange} defaultChecked={onlyBin} className="flipper-filter-formfield" type="checkbox" disabled={!props.isPremium && !freePremiumFilters} />

    </Form.Group>;

    const soldFilter = <Form.Group>
        <Form.Label htmlFor="onlyUnsoldCheckbox" className="flipper-filter-formfield-label only-bin-label">Hide SOLD Auctions</Form.Label>
        <Form.Check ref={onlyUnsoldRef} id="onlyUnsoldCheckbox" onChange={onOnlyUnsoldChange} defaultChecked={onlyUnsold} className="flipper-filter-formfield" type="checkbox" disabled={!props.isPremium && !freePremiumFilters} />
    </Form.Group>;

    const openRestrictionListDialog = <div onClick={() => { setShowRestrictionList(true) }} style={{ cursor: "pointer" }}>
        <span className="flipper-filter-formfield-label only-bin-label">Blacklist</span>
        <FilterIcon className="flipper-filter-formfield" style={{ marginLeft: "-4px" }} />
    </div>

    const numberFilters = <div style={{ display: "flex", alignContent: "center", justifyContent: "flex-start" }}>
        <Form.Group className="filterTextfield">
            <Form.Label className="flipper-filter-formfield-label">Min. Profit:</Form.Label>
            <Form.Control id="filter-input-min-profit" key="filter-input-min-profit" onChange={onMinProfitChange} className="flipper-filter-formfield flipper-filter-formfield-text" type="text" disabled={!props.isLoggedIn && !freeLoginFilters} />
        </Form.Group>
        <Form.Group className="filterTextfield">
            <Form.Label className="flipper-filter-formfield-label">Min. Volume:</Form.Label>
            <Form.Control id="filter-input-min-volume" key="filter-input-min-volume" onChange={onMinVolumeChange} className="flipper-filter-formfield flipper-filter-formfield-text" disabled={!props.isLoggedIn && !freeLoginFilters} />
        </Form.Group>
        <Form.Group className="filterTextfield">
            <Form.Label className="flipper-filter-formfield-label">Max. Cost:</Form.Label>
            <Form.Control id="filter-input-max-cost" key="filter-input-max-cost" onChange={onMaxCostChange} className="flipper-filter-formfield flipper-filter-formfield-text" disabled={!props.isLoggedIn && !freeLoginFilters} />
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
                    {openRestrictionListDialog}
                </div>

                <div style={{ visibility: "hidden", height: 0 }}>
                    <Countdown key={uuids[2]} onComplete={onFreePremiumComplete} date={FREE_PREMIUM_FILTER_TIME} />
                    <Countdown key={uuids[3]} onComplete={onFreeLoginComplete} date={FREE_LOGIN_FILTER_TIME} />
                </div>

            </Form >
            {restrictionListDialog}
        </div>
    );

}

export default FlipperFilter;