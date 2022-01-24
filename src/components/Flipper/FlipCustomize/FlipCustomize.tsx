import { useMatomo } from '@datapunt/matomo-tracker-react';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { DEFAULT_MOD_FORMAT, DEMO_FLIP, FLIP_FINDERS, getDefaulFlipFinders, getFlipCustomizeSettings } from '../../../utils/FlipUtils';
import { FLIPPER_FILTER_KEY, FLIP_CUSTOMIZING_KEY, getSetting, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils';
import Tooltip from '../../Tooltip/Tooltip';
import Flip from '../Flip/Flip';
import './FlipCustomize.css'
import { Help as HelpIcon, Refresh as RefreshIcon } from '@material-ui/icons';
import { toast } from 'react-toastify';
import Select, { components } from 'react-select';
import { useForceUpdate } from '../../../utils/Hooks';

let settings = getFlipCustomizeSettings();

const customSelectStyle = {
    option: (provided) => ({
        ...provided,
        color: "black"
    }),
}

function FlipCustomize() {

    let [flipCustomizeSettings, _setFlipCustomizeSettings] = useState(settings);
    let { trackEvent } = useMatomo();
    let formatExampleRef = useRef(null);

    let forceUpdate = useForceUpdate();

    useEffect(() => {
        renderFormatExampleText(settings);
    }, [])

    function setFlipCustomizeSettings(settings: FlipCustomizeSettings) {
        renderFormatExampleText(settings);
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(settings));
        _setFlipCustomizeSettings(settings);
        document.dispatchEvent(new CustomEvent("flipSettingsChange"));
    }

    function onChangeBoolean(key: string, value: boolean) {
        flipCustomizeSettings[key] = value;
        setFlipCustomizeSettings(flipCustomizeSettings);
        trackChange(key);
    }

    function onMaxExtraInfoFieldsChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.maxExtraInfoFields = event.target.valueAsNumber;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('maxExtraInfoFields');
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

    function onShortNumbersChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.shortNumbers = event.target.checked;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('shortNumbers');
    }

    function onFindersChange(newValue) {
        flipCustomizeSettings.finders = newValue.map(value => value.value);
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('finders');
    }

    function onModFormatChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.modFormat = event.target.value;
        setFlipCustomizeSettings(flipCustomizeSettings);

        trackChange('modFormat');
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

    function onModDefaultFormatCheckboxChange(event) {
        if (event.target.checked) {
            setDefaultModFormat()
        } else {
            flipCustomizeSettings.modFormat = "";
            setFlipCustomizeSettings(flipCustomizeSettings)
        }
        forceUpdate();
    }

    function setDefaultModFormat() {
        flipCustomizeSettings.modFormat = DEFAULT_MOD_FORMAT;
        setFlipCustomizeSettings(flipCustomizeSettings);
        trackEvent({
            category: 'customizeFlipStyle',
            action: "modFormat: default"
        });
    }

    function renderFormatExampleText(settings: FlipCustomizeSettings) {
        if (!settings.modFormat) {
            return "";
        }

        var values = {
            "0": "FLIP",
            "1": "§2",
            "2": "Armadillo",
            "3": "§1",
            "4": settings.shortNumbers ? "1.49M" : "1.490.000",
            "5": settings.shortNumbers ? "2M" : "2.000.000",
            "6": settings.shortNumbers ? "470k" : "470.000",
            "7": "31%",
            "8": settings.shortNumbers ? "2M" : "2.000.000",
            "9": settings.shortNumbers ? "1M" : "1.000.000",
            "10": "26"
        };

        let resultText = settings.modFormat.replace(/\{([^}]+)\}/g, function (i, match) {
            return values[match];
        });

        // Timeout, to wait for the react-render, as the modFormat may have been hidden before
        setTimeout(() => {
            if (formatExampleRef.current !== null) {
                (formatExampleRef.current! as HTMLElement).innerHTML = "";
                (formatExampleRef.current! as HTMLElement).appendChild((resultText as any).replaceColorCodes());
            }
        }, 0);

    }

    const useLowestBinHelpElement = (
        <p>By enabling this setting, the lowest BIN is used as the estimated selling price to calculate your profit. That can lead to profitable flips being estimated way too low (even as a loss). We recommend using the median to calculate the profit.</p>
    );

    const formatHelpTooltip = (
        <div>
            <p>The format, the mod displays messages. The followig symbols are replaced by the actual values:</p>
            <ul>
                <li>&#123;0&#125; FlipFinder</li>
                <li>&#123;1&#125; Item Rarity Color</li>
                <li>&#123;2&#125; Item Name</li>
                <li>&#123;3&#125; Price color</li>
                <li>&#123;4&#125; Starting bid</li>
                <li>&#123;5&#125; Target Price</li>
                <li>&#123;6&#125; Estimated Profit</li>
                <li>&#123;7&#125; Provit percentage</li>
                <li>&#123;8&#125; Median Price</li>
                <li>&#123;9&#125; Lowest Bin</li>
                <li>&#123;10&#125; Volume</li>
            </ul>
            <p>It uses the default format if unchecked.</p>
        </div>
    );

    const MultiValueContainer = (props) => {
        return <components.MultiValueContainer {...props} ><Tooltip type={"hover"} content={<div {...props.innerProps}>{props.children}</div>} tooltipContent={<span>{props.data.description}</span>} /></components.MultiValueContainer>
    };

    return (
        <div className="flip-customize">
            <div className="section-left">
                <Form className="section">
                    <div>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideCost">Cost</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("hideCost", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideCost} id="hideCost" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideEstimatedProfit">Estimated Profit</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("hideEstimatedProfit", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideEstimatedProfit} id="hideEstimatedProfit" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideSecondLowestBin">Second lowest BIN</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("hideSecondLowestBin", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideSecondLowestBin} id="hideSecondLowestBin" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideVolume">Volume</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("hideVolume", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideVolume} id="hideVolume" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="shortNumbers">Shorten numbers?</Form.Label>
                            <Form.Check onChange={onShortNumbersChange} defaultChecked={flipCustomizeSettings.shortNumbers} id="shortNumbers" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="profitPercent">Profit percent?</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("profitPercent", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideProfitPercent} id="profitPercent" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideMaxExtraInfo">Max. extra info fields</Form.Label>
                            <Form.Control min={0} max={30} onChange={onMaxExtraInfoFieldsChange} defaultValue={flipCustomizeSettings.maxExtraInfoFields} type="number" id="hideMaxExtraInfo" />
                        </Form.Group>
                    </div>
                    <div>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideMedianPrice">Median price</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("hideMedianPrice", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideMedianPrice} id="hideMedianPrice" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideLowestBin">Lowest BIN</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("hideLowestBin", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideLowestBin} id="hideLowestBin" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideSeller">Seller</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("hideSeller", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideSeller} id="hideSeller" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="hideCopyMessage">Show copy message</Form.Label>
                            <Form.Check onChange={event => onChangeBoolean("hideCopyMessage", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideCopySuccessMessage} id="hideCopyMessage" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="disableLinks">Disable links</Form.Label>
                            <Form.Check onChange={onDisableLinksChange} defaultChecked={flipCustomizeSettings.disableLinks} id="hideCopyMessage" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                        <Form.Group className="select-hide-group">
                            <Form.Label className="label" htmlFor="useLowestBinForProfit">Use lowest BIN <br /> to calc. profit <Tooltip type="hover" content={<HelpIcon style={{ color: "#007bff", cursor: "pointer" }} />} tooltipContent={useLowestBinHelpElement} /></Form.Label>
                            <Form.Check onChange={onUseLowestBinForProfitChange} defaultChecked={flipCustomizeSettings.useLowestBinForProfit} id="useLowestBinForProfit" style={{ display: "inline" }} type="checkbox" />
                        </Form.Group>
                    </div>
                </Form>
                <div style={{ marginLeft: "30px", marginRight: "30px" }}>
                    <label htmlFor="finders" className="label">Used Flip-Finders</label>
                    <Select id="finders" className="select-hide-group" isMulti options={FLIP_FINDERS} defaultValue={getDefaulFlipFinders(settings.finders || [])} styles={customSelectStyle} onChange={onFindersChange} closeMenuOnSelect={false}
                        components={{ MultiValueContainer }} />
                </div>
                <hr />
                <div>
                    <h5>Mod settings</h5>
                    <Form className="section">
                        <div>
                            <Form.Group className="select-hide-group">
                                <Form.Label className="label" htmlFor="justProfit">Just show profit</Form.Label>
                                <Form.Check onChange={onJustProfitChange} defaultChecked={flipCustomizeSettings.justProfit} id="justProfit" style={{ display: "inline" }} type="checkbox" />
                            </Form.Group>
                            <Form.Group className="select-hide-group">
                                <Form.Label className="label" htmlFor="blockTenSecMsg">"Flips in 10 seconds"</Form.Label>
                                <Form.Check onChange={event => onChangeBoolean("blockTenSecMsg", !event.target.checked)} defaultChecked={!flipCustomizeSettings.blockTenSecMsg} id="blockTenSecMsg" style={{ display: "inline" }} type="checkbox" />
                            </Form.Group>
                            <Form.Group className="select-hide-group">
                                <Form.Label className="label" htmlFor="hideSellerOpenBtn">Seller AH Button</Form.Label>
                                <Form.Check onChange={event => onChangeBoolean("hideSellerOpenBtn", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideSellerOpenBtn} id="hideSellerOpenBtn" style={{ display: "inline" }} type="checkbox" />
                            </Form.Group>
                        </div>
                        <div>
                            <Form.Group className="select-hide-group">
                                <Form.Label className="label" htmlFor="soundOnFlip">Play flip sound</Form.Label>
                                <Form.Check onChange={onSoundOnFlipChange} defaultChecked={flipCustomizeSettings.soundOnFlip} id="soundOnFlip" style={{ display: "inline" }} type="checkbox" />
                            </Form.Group>
                            <Form.Group className="select-hide-group">
                                <Form.Label className="label" htmlFor="hideModChat">Mod Chat</Form.Label>
                                <Form.Check onChange={event => onChangeBoolean("hideModChat", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideModChat} id="hideModChat" style={{ display: "inline" }} type="checkbox" />
                            </Form.Group>
                            <Form.Group className="select-hide-group">
                                <Form.Label className="label" htmlFor="hideLore">Item lore (on hover)</Form.Label>
                                <Form.Check onChange={event => onChangeBoolean("hideLore", !event.target.checked)} defaultChecked={!flipCustomizeSettings.hideLore} id="hideLore" style={{ display: "inline" }} type="checkbox" />
                            </Form.Group>
                        </div>
                    </Form>
                    <div style={{ marginLeft: "30px", marginRight: "30px" }}>
                        <label htmlFor="finders" className="label">Custom format <Tooltip type="hover" content={<HelpIcon style={{ color: "#007bff", cursor: "pointer" }} />} tooltipContent={formatHelpTooltip} /></label>
                        <Form.Check onChange={onModDefaultFormatCheckboxChange} defaultChecked={!!flipCustomizeSettings.modFormat} id="hideLore" style={{ display: "inline" }} type="checkbox" />
                        {
                            flipCustomizeSettings.modFormat ?
                                <div>
                                    <div style={{ display: "flex" }}>
                                        <Form.Control key={flipCustomizeSettings.modFormat} as="textarea" style={{ width: "100%" }} onChange={onModFormatChange} defaultValue={flipCustomizeSettings.modFormat} />
                                        <Button style={{ whiteSpace: "nowrap" }} onClick={setDefaultModFormat}>
                                            <RefreshIcon />
                                            Default
                                        </Button>
                                    </div>
                                    <p ref={formatExampleRef} />
                                </div> : null
                        }
                    </div>
                </div>
                <hr />
                <div>
                    <h5>Import/Export</h5>
                    <p>You can export your custom flipper settings into a .json file. You use this to send your settings to a friend or to restore them later yourself by importing them again.</p>
                    <p>After importing a settings file, the page will reload to apply the new settings.</p>
                    <div className="section" style={{ justifyContent: "space-between" }}>
                        <Button onClick={() => { document.getElementById("fileUpload")?.click() }} style={{ width: "40%" }}>Import</Button>
                        <Button onClick={exportFilter} style={{ width: "40%" }}>Export</Button>

                        {/* This is the "true" upload field. It is called by the "Import"-Button */}
                        <input onChange={readImportFile} style={{ display: "none" }} type="file" id="fileUpload" />
                    </div>
                </div>
                <hr />
            </div>
            <div className="vertical-line"></div>
            <div className="section-right section">
                <Flip style={{ width: "300px" }} flip={DEMO_FLIP} />
            </div>
        </div>
    );
}

export default React.memo(FlipCustomize);