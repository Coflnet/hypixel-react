import { useMatomo } from '@datapunt/matomo-tracker-react';
import React, { ChangeEvent, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { DEMO_FLIP, getFlipCustomizeSettings } from '../../../utils/FlipUtils';
import { FLIPPER_FILTER_KEY, FLIP_CUSTOMIZING_KEY, getSetting, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils';
import Tooltip from '../../Tooltip/Tooltip';
import Flip from '../Flip/Flip';
import './FlipCustomize.css'
import { Help as HelpIcon } from '@material-ui/icons';
import { toast } from 'react-toastify';

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

    function onDisableLinksChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.disableLinks = event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('disableLinks');
    }

    function onJustProfitChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.justProfit = event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('justProfit');
    }

    function onSoundOnFlipChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.soundOnFlip = event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('soundOnFlip');
    }

    function trackChange(property: string) {
        trackEvent({
            category: 'customizeFlipStyle',
            action: property + ": " + flipCustomizeSettings[property]
        });
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    function exportFilter() {
        let exportFilter = {};

        exportFilter[FLIP_CUSTOMIZING_KEY] = getSetting(FLIP_CUSTOMIZING_KEY);
        exportFilter[RESTRICTIONS_SETTINGS_KEY] = getSetting(RESTRICTIONS_SETTINGS_KEY);
        exportFilter[FLIPPER_FILTER_KEY] = getSetting(FLIPPER_FILTER_KEY);

        download("filter.json", JSON.stringify(exportFilter));
    }

    function readImportFile(e) {
        var output = ""; //placeholder for text output
        let reader = new FileReader();
        if (e.target.files && e.target.files[0]) {
            reader.onload = function (e) {
                output = e.target!.result!.toString();
                handleFilterImport(output);
            };//end onload()
            reader.readAsText(e.target.files[0]);
        }
        return true;
    }

    function handleFilterImport(importString: string) {
        let filter: FlipperFilter;
        let flipCustomizeSettings: FlipCustomizeSettings;
        let restrictions: FlipRestriction[];
        try {
            let importObject = JSON.parse(importString);
            filter = importObject[FLIPPER_FILTER_KEY] ? JSON.parse(importObject[FLIPPER_FILTER_KEY]) : "";
            flipCustomizeSettings = importObject[FLIP_CUSTOMIZING_KEY] ? JSON.parse(importObject[FLIP_CUSTOMIZING_KEY]) : "";
            restrictions = importObject[RESTRICTIONS_SETTINGS_KEY] ? JSON.parse(importObject[RESTRICTIONS_SETTINGS_KEY]) : "";
        } catch {
            toast.error("The import of the filter settings failed. Please make sure this is a valid filter file.")
            return;
        }

        setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter));
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(flipCustomizeSettings));
        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(restrictions));

        window.location.reload();
    }

    let useLowestBinHelpElement = (
        <p>By enabling this setting, the lowest BIN is used as the estimated selling price to calculate your profit. That can lead to profitable flips being estimated way too low (even as a loss). We recommend using the median to calculate the profit.</p>
    );

    return (
        <div className="flip-customize">
            <div style={{ width: "50%" }}>
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
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideMaxExtraInfo">Max. extra info fields</Form.Label>
                            <Form.Control min={0} max={30} onChange={onMaxExtraInfoFieldsChange} defaultValue={flipCustomizeSettings.maxExtraInfoFields} type="number" id="hideMaxExtraInfo" />
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
                            <Form.Label className="label" htmlFor="disableLinks">Disable links</Form.Label>
                            <Form.Check onChange={onDisableLinksChange} defaultChecked={flipCustomizeSettings.disableLinks} id="hideCopyMessage" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                    </div>
                </Form>
                <hr />
                <div>
                    <h5>Mod settings</h5>
                    <Form className="section">
                        <div>
                            <Form.Group className="select-hide-group">
                                <Form.Label className="label" htmlFor="justProfit">Just show profit</Form.Label>
                                <Form.Check onChange={onJustProfitChange} defaultChecked={flipCustomizeSettings.justProfit} id="justProfit" style={{ display: "inline" }} type="checkbox" />
                            </Form.Group>
                        </div>
                        <div>
                            <Form.Group className="select-hide-group">
                                <Form.Label className="label" htmlFor="soundOnFlip">Play flip sound</Form.Label>
                                <Form.Check onChange={onSoundOnFlipChange} defaultChecked={flipCustomizeSettings.soundOnFlip} id="soundOnFlip" style={{ display: "inline" }} type="checkbox" />
                            </Form.Group>
                        </div>
                    </Form>
                </div>
                <hr />
                <div>
                    <h5>Import/Export</h5>
                    <p>You can export your custom flipper settings into a .json file. You use this to send your settings to a friend or to restore them later yourself by importing them again.</p>
                    <p>After importing a settings file, the page will reload to apply the new settings.</p>
                    <div className="section">
                        <Button onClick={() => { document.getElementById("fileUpload")?.click() }} style={{ width: "40%" }}>Import</Button>
                        <Button onClick={exportFilter} style={{ width: "40%" }}>Export</Button>

                        {/* This is the "true" upload field. It is called by the "Import"-Button */}
                        <input onChange={readImportFile} style={{ display: "none" }} type="file" id="fileUpload" />
                    </div>
                </div>
                <hr />
            </div>
            <div className="vertical-line"></div>
            <div className="section" style={{ width: "50%" }}>
                <Flip style={{ width: "300px" }} flip={DEMO_FLIP} />
            </div>
        </div>
    );
}

export default FlipCustomize;