import { useMatomo } from '@datapunt/matomo-tracker-react';
import React, { ChangeEvent, useState } from 'react';
import { Form } from 'react-bootstrap';
import { DEMO_FLIP, getFlipCustomizeSettings } from '../../../utils/FlipUtils';
import { FLIP_CUSTOMIZING_KEY, setSetting } from '../../../utils/SettingsUtils';
import Tooltip from '../../Tooltip/Tooltip';
import Flip from '../Flip/Flip';
import './FlipCustomize.css'
import { Help as HelpIcon } from '@material-ui/icons';

let settings = getFlipCustomizeSettings();

function FlipCustomize() {

    let [flipCustomizeSettings, _setFlipCustomizeSettings] = useState(settings);
    let { trackEvent } = useMatomo();

    function setFlipCustomizeSettings(settings: FlipCustomizeSettings) {
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(settings));
        _setFlipCustomizeSettings(settings);
        document.dispatchEvent(new CustomEvent("flipSettingsChange"));
    }

    function onCostChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideCost = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('hideCost');
    }

    function onLowestBinChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideLowestBin = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('hideLowestBin');
    }

    function onMedianPriceChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideMedianPrice = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('hideMedianPrice');
    }

    function onSellerChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideSeller = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('hideSeller');
    }

    function onEstimantedProfitChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideEstimatedProfit = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('hideEstimatedProfit');
    }

    function onVolumeChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideVolume = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('hideVolume');
    }

    function onMaxExtraInfoFieldsChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.maxExtraInfoFields = event.target.valueAsNumber;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('maxExtraInfoFields');
    }

    function onHideCopyMessage(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideCopySuccessMessage = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('hideCopySuccessMessage');
    }

    function onSecondLowestBinChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.hideSecondLowestBin = !event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('hideSecondLowestBin');
    }

    function onUseLowestBinForProfitChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.useLowestBinForProfit = event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('useLowestBinForProfit');
    }

    function trackChange(property: string) {
        trackEvent({
            category: 'customizeFlipStyle',
            action: property + ": " + flipCustomizeSettings[property]
        });
    }

    let useLowestBinHelpElement = (
        <p>By enabling this setting, the lowest BIN is used as the estimated selling price to calculate your profit. That can lead to profitable flips being estimated way too low (even as a loss). We recommend using the median to calculate the profit.</p>
    );

    return (
        <div className="flip-customize">
            <Form className="section">
                <div>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideCost">Cost</Form.Label>
                        <Form.Check onChange={onCostChange} defaultChecked={!flipCustomizeSettings.hideCost} id="hideCost" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideEstimatedProfit">Estimated Profit</Form.Label>
                        <Form.Check onChange={onEstimantedProfitChange} defaultChecked={!flipCustomizeSettings.hideEstimatedProfit} id="hideEstimatedProfit" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideSecondLowestBin">Second lowest BIN</Form.Label>
                        <Form.Check onChange={onSecondLowestBinChange} defaultChecked={!flipCustomizeSettings.hideSecondLowestBin} id="hideSecondLowestBin" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideVolume">Volume</Form.Label>
                        <Form.Check onChange={onVolumeChange} defaultChecked={!flipCustomizeSettings.hideVolume} id="hideVolume" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="useLowestBinForProfit">Use lowest BIN <br /> to calc. profit <Tooltip type="hover" content={<HelpIcon style={{ color: "#007bff", cursor: "pointer" }} />} tooltipContent={useLowestBinHelpElement} /></Form.Label>
                        <Form.Check onChange={onUseLowestBinForProfitChange} defaultChecked={flipCustomizeSettings.useLowestBinForProfit} id="useLowestBinForProfit" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                </div>
                <div>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideMedianPrice">Median price</Form.Label>
                        <Form.Check onChange={onMedianPriceChange} defaultChecked={!flipCustomizeSettings.hideMedianPrice} id="hideMedianPrice" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideLowestBin">Lowest BIN</Form.Label>
                        <Form.Check onChange={onLowestBinChange} defaultChecked={!flipCustomizeSettings.hideLowestBin} id="hideLowestBin" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideSeller">Seller</Form.Label>
                        <Form.Check onChange={onSellerChange} defaultChecked={!flipCustomizeSettings.hideSeller} id="hideSeller" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideCopyMessage">Show copy message</Form.Label>
                        <Form.Check onChange={onHideCopyMessage} defaultChecked={!flipCustomizeSettings.hideCopySuccessMessage} id="hideCopyMessage" style={{ display: "inline" }} type="checkbox" />
                    </Form.Group>
                    <Form.Group className="select-hide-group">
                        <Form.Label className="label" htmlFor="hideMaxExtraInfo">Max. extra info fields</Form.Label>
                        <Form.Control min={0} max={30} onChange={onMaxExtraInfoFieldsChange} defaultValue={flipCustomizeSettings.maxExtraInfoFields} type="number" id="hideMaxExtraInfo" />
                    </Form.Group>
                </div>
            </Form>
            <div className="vertical-line"></div>
            <div className="section">
                <Flip style={{ width: "300px" }} flip={DEMO_FLIP} />
            </div>
        </div>
    );
}

export default FlipCustomize;