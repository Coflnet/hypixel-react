import React, { ChangeEvent, useState } from 'react';
import { Form } from 'react-bootstrap';
import { DEMO_FLIP } from '../../../utils/FlipUtils';
import { FLIP_CUSTOMIZING_KEY, getSetting, setSetting } from '../../../utils/SettingsUtils';
import Flip from '../Flip/Flip';
import './FlipCustomize.css'

let settings: FlipCustomizeSettings;
try {
    settings = JSON.parse(getSetting(FLIP_CUSTOMIZING_KEY));
} catch {
    settings = {
        hideCost: false,
        hideEstimatedProfit: false,
        hideLowestBin: false,
        hideMedianPrice: false,
        hideSeller: false,
        hideVolume: false,
        maxExtraInfoFields: 3
    };
    setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(settings))
}

function FlipCustomize() {

    let [flipCustomizeSettings, _setFlipCustomizeSettings] = useState(settings);

    function setFlipCustomizeSettings(settings: FlipCustomizeSettings) {
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(settings));
        _setFlipCustomizeSettings(settings);
        document.dispatchEvent(new CustomEvent("flipSettingsChange"));
    }

    function onCostChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideCost = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);
    }

    function onLowestBinChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideLowestBin = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);
    }

    function onMedianPriceChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideMedianPrice = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);
    }

    function onSellerChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideSeller = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);
    }

    function onEstimantedProfitChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideEstimatedProfit = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);
    }

    function onVolumeChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideVolume = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);
    }

    function onMaxExtraInfoFieldsChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.maxExtraInfoFields = event.target.valueAsNumber;
        setFlipCustomizeSettings(flipCustomizeSettings);
    }

    return (
        <div className="flip-customize">
            <div style={{ display: "flex", alignContent: "center", justifyContent: "space-between" }}>
                <Form style={{ width: "50%", margin: "20px", display: "flex", alignContent: "center", justifyContent: "space-around" }}>
                    <div>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideCost">Cost:</Form.Label>
                            <Form.Check onChange={onCostChange} defaultChecked={!flipCustomizeSettings.hideCost} id="hideCost" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideMedianPrice">Median price:</Form.Label>
                            <Form.Check onChange={onMedianPriceChange} defaultChecked={!flipCustomizeSettings.hideMedianPrice} id="hideMedianPrice" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideEstimatedProfit">Estimated Profit:</Form.Label>
                            <Form.Check onChange={onEstimantedProfitChange} defaultChecked={!flipCustomizeSettings.hideEstimatedProfit} id="hideEstimatedProfit" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideMaxExtraInfo">Max. extra info fields:</Form.Label>
                            <Form.Control min={0} max={30} onChange={onMaxExtraInfoFieldsChange} defaultValue={flipCustomizeSettings.maxExtraInfoFields} type="number" id="hideMaxExtraInfo" />
                        </Form.Group>
                    </div>
                    <div>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideLowestBin">Lowest BIN:</Form.Label>
                            <Form.Check onChange={onLowestBinChange} defaultChecked={!flipCustomizeSettings.hideLowestBin} id="hideLowestBin" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideSeller">Seller:</Form.Label>
                            <Form.Check onChange={onSellerChange} defaultChecked={!flipCustomizeSettings.hideSeller} id="hideSeller" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideVolume">Volume:</Form.Label>
                            <Form.Check onChange={onVolumeChange} defaultChecked={!flipCustomizeSettings.hideVolume} id="hideVolume" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                    </div>
                </Form>
                <div className="vertical-line"></div>
                <div style={{ width: "50%", display: "flex", alignContent: "center", justifyContent: "space-around" }}>
                    <Flip style={{ width: "300px" }} flip={DEMO_FLIP} />
                </div>
            </div>
        </div>
    );
}

export default FlipCustomize;