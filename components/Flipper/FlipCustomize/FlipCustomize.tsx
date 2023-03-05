import { useMatomo } from '@datapunt/matomo-tracker-react'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { DEMO_FLIP, FLIP_FINDERS, getFlipFinders, getFlipCustomizeSettings } from '../../../utils/FlipUtils'
import { FLIPPER_FILTER_KEY, FLIP_CUSTOMIZING_KEY, getSetting, handleSettingsImport, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils'
import Tooltip from '../../Tooltip/Tooltip'
import Flip from '../Flip/Flip'
import HelpIcon from '@mui/icons-material/Help'
import Select, { components } from 'react-select'
import FormatElement from './FormatElement/FormatElement'
import styles from './FlipCustomize.module.css'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'

const customSelectStyle = {
    option: provided => ({
        ...provided,
        color: 'black'
    })
}

function FlipCustomize() {
    let [flipCustomizeSettings, setFlipCustomizeSettings] = useState<FlipCustomizeSettings>({})
    let { trackEvent } = useMatomo()

    useEffect(() => {
        setFlipCustomizeSettings(getFlipCustomizeSettings())
    }, [])

    function setFlipCustomizeSetting(key: string, value: any) {
        flipCustomizeSettings[key] = value
        setFlipCustomizeSettings(flipCustomizeSettings)
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(flipCustomizeSettings))
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))
        setFlipCustomizeSettings({ ...flipCustomizeSettings })
    }

    function updateApiSetting(key: string, value: boolean) {
        api.setFlipSetting(key, value)
        trackChange(key)
    }

    function onMaxExtraInfoFieldsChange(event: ChangeEvent<HTMLInputElement>) {
        setFlipCustomizeSetting('maxExtraInfoFields', event.target.valueAsNumber)
        api.setFlipSetting('showExtraFields', event.target.valueAsNumber || 0)
        trackChange('maxExtraInfoFields')
    }

    function onFindersChange(newValue) {
        setFlipCustomizeSetting(
            'finders',
            newValue.map(value => value.value)
        )
        api.setFlipSetting(
            'finders',
            flipCustomizeSettings.finders?.reduce((a, b) => +a + +b, 0)
        )
        trackChange('finders')
    }

    function onModFormatChange(value: string) {
        setFlipCustomizeSetting('modFormat', value)
        api.setFlipSetting('modFormat', value.replaceAll('§', '$'))
        trackChange('modFormat')
    }

    function trackChange(property: string) {
        trackEvent({
            category: 'customizeFlipStyle',
            action: property + ': ' + flipCustomizeSettings[property]
        })
    }

    function download(filename, text) {
        var element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
        element.setAttribute('download', filename)

        element.style.display = 'none'
        document.body.appendChild(element)

        element.click()

        document.body.removeChild(element)
    }

    function exportFilter() {
        let exportFilter = {}

        exportFilter[FLIP_CUSTOMIZING_KEY] = getSetting(FLIP_CUSTOMIZING_KEY, '{}')
        exportFilter[RESTRICTIONS_SETTINGS_KEY] = getSetting(RESTRICTIONS_SETTINGS_KEY, '[]')
        exportFilter[FLIPPER_FILTER_KEY] = getSetting(FLIPPER_FILTER_KEY, '{}')

        download('filter.json', JSON.stringify(exportFilter))
    }

    function readImportFile(e) {
        var output = '' //placeholder for text output
        let reader = new FileReader()
        if (e.target.files && e.target.files[0]) {
            reader.onload = function (e) {
                output = e.target!.result!.toString()
                handleSettingsImport(output)
            } //end onload()
            reader.readAsText(e.target.files[0])
        }
        return true
    }

    function getFlipFinderWarningElement(): JSX.Element {
        let warnings: string[] = []

        let sniperFinder = FLIP_FINDERS.find(finder => finder.label === 'Sniper')
        if (
            sniperFinder &&
            flipCustomizeSettings.useLowestBinForProfit &&
            (!flipCustomizeSettings.finders ||
                flipCustomizeSettings.finders.length === 0 ||
                flipCustomizeSettings.finders.length > 1 ||
                flipCustomizeSettings.finders[0].toString() !== sniperFinder.value)
        ) {
            warnings.push(
                'Only use the "Sniper"-Finder with "Use lbin to calculate profit option". Using other finders may lead to muliple seconds of delay as this will require additional calculations.'
            )
        }

        let tfmFinder = FLIP_FINDERS.find(finder => finder.label === 'TFM')
        if (flipCustomizeSettings.finders.find(finder => finder.toString() === tfmFinder.value)) {
            warnings.push('The "TFM"-Finder is work in progress and therefore considered risky. Only use if you know what you are doing.')
        }

        let stonksFinder = FLIP_FINDERS.find(finder => finder.label === 'Stonks')
        if (flipCustomizeSettings.finders.find(finder => finder.toString() === stonksFinder.value)) {
            warnings.push('The "Stonks"-Finder is work in progress and therefore considered risky. Only use if you know what you are doing.')
        }

        if (warnings.length === 0) {
            return null
        }
        if (warnings.length === 1) {
            return (
                <b>
                    <p style={{ color: 'red' }}>{warnings[0]}</p>
                </b>
            )
        }
        return (
            <ul style={{ color: 'red' }}>
                {warnings.map(warning => (
                    <li>{warning}</li>
                ))}
            </ul>
        )
    }

    const useLowestBinHelpElement = (
        <p>
            By enabling this setting, the lowest BIN is used as the estimated selling price to calculate your profit. That can lead to profitable flips being
            estimated way too low (even as a loss). It also add a little time to process the flips. We recommend using the median to calculate the profit.
        </p>
    )

    const MultiValueContainer = props => {
        return (
            <components.MultiValueContainer {...props}>
                <Tooltip type={'hover'} content={<div {...props.innerProps}>{props.children}</div>} tooltipContent={<span>{props.data.description}</span>} />
            </components.MultiValueContainer>
        )
    }

    if (Object.keys(flipCustomizeSettings).length === 0) {
        return <></>
    }

    return (
        <div className={styles.flipCustomize}>
            <div className={styles.sectionLeft}>
                <Form className={styles.section}>
                    <div>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideCost">
                                Cost
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showCost', event.target.checked)
                                    setFlipCustomizeSetting('hideCost', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideCost}
                                id="hideCost"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideEstimatedProfit">
                                Estimated Profit
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showEstProfit', event.target.checked)
                                    setFlipCustomizeSetting('hideEstimatedProfit', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideEstimatedProfit}
                                id="hideEstimatedProfit"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideSecondLowestBin">
                                Second lowest BIN
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showSlbin', event.target.checked)
                                    setFlipCustomizeSetting('hideSecondLowestBin', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideSecondLowestBin}
                                id="hideSecondLowestBin"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideVolume">
                                Volume
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showVolume', event.target.checked)
                                    setFlipCustomizeSetting('hideVolume', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideVolume}
                                id="hideVolume"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="shortNumbers">
                                Shorten numbers?
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('modShortNumbers', event.target.checked)
                                    setFlipCustomizeSetting('shortNumbers', event.target.checked)
                                }}
                                defaultChecked={flipCustomizeSettings.shortNumbers}
                                id="shortNumbers"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideProfitPercent">
                                Profit percent?
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showProfitPercent', event.target.checked)
                                    setFlipCustomizeSetting('hideProfitPercent', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideProfitPercent}
                                id="hideProfitPercent"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideMaxExtraInfo">
                                Max. extra info fields
                            </Form.Label>
                            <Form.Control
                                min={0}
                                max={30}
                                onChange={onMaxExtraInfoFieldsChange}
                                defaultValue={flipCustomizeSettings.maxExtraInfoFields}
                                type="number"
                                id="hideMaxExtraInfo"
                            />
                        </Form.Group>
                    </div>
                    <div>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideMedianPrice">
                                Median price
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showMedPrice', event.target.checked)
                                    setFlipCustomizeSetting('hideMedianPrice', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideMedianPrice}
                                id="hideMedianPrice"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideLowestBin">
                                Lowest BIN
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showLbin', event.target.checked)
                                    setFlipCustomizeSetting('hideLowestBin', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideLowestBin}
                                id="hideLowestBin"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideSeller">
                                Seller{'  '}
                                <Tooltip
                                    type="hover"
                                    content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer' }} />}
                                    tooltipContent={
                                        <span>
                                            Showing the player name takes additional processing time and therefore may add a bit of a delay for the flips.
                                        </span>
                                    }
                                />
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showSeller', event.target.checked)
                                    setFlipCustomizeSetting('hideSeller', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideSeller}
                                id="hideSeller"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideCopySuccessMessage">
                                Show copy message
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showCopySuccessMessage', event.target.checked)
                                    setFlipCustomizeSetting('hideCopySuccessMessage', !event.target.checked)
                                }}
                                defaultChecked={!flipCustomizeSettings.hideCopySuccessMessage}
                                id="hideCopySuccessMessage"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="disableLinks">
                                Disable links
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('showLinks', !event.target.checked)
                                    setFlipCustomizeSetting('disableLinks', event.target.checked)
                                }}
                                defaultChecked={flipCustomizeSettings.disableLinks}
                                id="disableLinks"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="useLowestBinForProfit">
                                Use lowest BIN <br /> to calc. profit{' '}
                                <Tooltip
                                    type="hover"
                                    content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer' }} />}
                                    tooltipContent={useLowestBinHelpElement}
                                />
                            </Form.Label>
                            <Form.Check
                                onChange={event => {
                                    updateApiSetting('lbin', event.target.checked)
                                    setFlipCustomizeSetting('useLowestBinForProfit', event.target.checked)
                                }}
                                defaultChecked={flipCustomizeSettings.useLowestBinForProfit}
                                id="useLowestBinForProfit"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                    </div>
                </Form>
                <div style={{ marginLeft: '30px', marginRight: '30px' }}>
                    <label htmlFor="finders" className={styles.label}>
                        Used Flip-Finders
                    </label>
                    <Select
                        id="finders"
                        isMulti
                        options={FLIP_FINDERS.filter(finder => finder.selectable)}
                        defaultValue={getFlipFinders(flipCustomizeSettings.finders || [])}
                        styles={customSelectStyle}
                        onChange={onFindersChange}
                        closeMenuOnSelect={false}
                        components={{ MultiValueContainer }}
                    />
                    {getFlipFinderWarningElement()}
                </div>
                <hr />
                <div>
                    <h5>Mod settings</h5>
                    <Form className={styles.section}>
                        <div>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="justProfit">
                                    Just show profit
                                </Form.Label>
                                <Form.Check
                                    onChange={event => {
                                        updateApiSetting('modJustProfit', event.target.checked)
                                        setFlipCustomizeSetting('justProfit', event.target.checked)
                                    }}
                                    defaultChecked={flipCustomizeSettings.justProfit}
                                    id="justProfit"
                                    style={{ display: 'inline' }}
                                    type="checkbox"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="blockTenSecMsg">
                                    "Flips in 10 seconds"
                                </Form.Label>
                                <Form.Check
                                    onChange={event => {
                                        updateApiSetting('modBlockTenSecMsg', !event.target.checked)
                                        setFlipCustomizeSetting('blockTenSecMsg', !event.target.checked)
                                    }}
                                    defaultChecked={!flipCustomizeSettings.blockTenSecMsg}
                                    id="blockTenSecMsg"
                                    style={{ display: 'inline' }}
                                    type="checkbox"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="hideSellerOpenBtn">
                                    Seller AH Button
                                </Form.Label>
                                <Form.Check
                                    onChange={event => {
                                        updateApiSetting('showSellerOpenBtn', event.target.checked)
                                        setFlipCustomizeSetting('hideSellerOpenBtn', !event.target.checked)
                                    }}
                                    defaultChecked={!flipCustomizeSettings.hideSellerOpenBtn}
                                    id="hideSellerOpenBtn"
                                    style={{ display: 'inline' }}
                                    type="checkbox"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="modCountdown">
                                    Countdown
                                </Form.Label>
                                <Form.Check
                                    onChange={event => {
                                        updateApiSetting('modCountdown', event.target.checked)
                                        setFlipCustomizeSetting('modCountdown', event.target.checked)
                                    }}
                                    defaultChecked={flipCustomizeSettings.modCountdown}
                                    id="modCountdown"
                                    style={{ display: 'inline' }}
                                    type="checkbox"
                                />
                            </Form.Group>
                        </div>
                        <div>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="soundOnFlip">
                                    Play flip sound
                                </Form.Label>
                                <Form.Check
                                    onChange={event => {
                                        updateApiSetting('modSoundOnFlip', event.target.checked)
                                        setFlipCustomizeSetting('soundOnFlip', event.target.checked)
                                    }}
                                    defaultChecked={flipCustomizeSettings.soundOnFlip}
                                    id="soundOnFlip"
                                    style={{ display: 'inline' }}
                                    type="checkbox"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="hideModChat">
                                    Mod Chat
                                </Form.Label>
                                <Form.Check
                                    onChange={event => {
                                        updateApiSetting('modChat', event.target.checked)
                                        setFlipCustomizeSetting('hideModChat', !event.target.checked)
                                    }}
                                    defaultChecked={!flipCustomizeSettings.hideModChat}
                                    id="hideModChat"
                                    style={{ display: 'inline' }}
                                    type="checkbox"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="hideLore">
                                    Item lore (on hover)
                                </Form.Label>
                                <Form.Check
                                    onChange={event => {
                                        updateApiSetting('showLore', event.target.checked)
                                        setFlipCustomizeSetting('hideLore', !event.target.checked)
                                    }}
                                    defaultChecked={!flipCustomizeSettings.hideLore}
                                    id="hideLore"
                                    style={{ display: 'inline' }}
                                    type="checkbox"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="modCountdown">
                                    Set maxCost to purse
                                </Form.Label>
                                <Form.Check
                                    onChange={event => {
                                        updateApiSetting('modNoAdjustToPurse', !event.target.checked)
                                        setFlipCustomizeSetting('modNoAdjustToPurse', !event.target.checked)
                                    }}
                                    defaultChecked={!flipCustomizeSettings.modNoAdjustToPurse}
                                    id="modNoAdjustToPurse"
                                    style={{ display: 'inline' }}
                                    type="checkbox"
                                />
                            </Form.Group>
                        </div>
                    </Form>
                    <div style={{ marginLeft: '30px', marginRight: '30px' }}>
                        <FormatElement onChange={onModFormatChange} settings={flipCustomizeSettings} labelClass={styles.label} />
                    </div>
                </div>
                <hr />
                <div style={{ margin: '20px' }}>
                    <h5>Import/Export</h5>
                    <p>
                        You can export your custom flipper settings into a .json file. You use this to send your settings to a friend or to restore them later
                        yourself by importing them again.
                    </p>
                    <p>After importing a settings file, the page will reload to apply the new settings.</p>
                    <div className={styles.section} style={{ justifyContent: 'space-between' }}>
                        <Button
                            onClick={() => {
                                document.getElementById('fileUpload')?.click()
                            }}
                            style={{ width: '40%' }}
                        >
                            Import
                        </Button>
                        <Button onClick={exportFilter} style={{ width: '40%' }}>
                            Export
                        </Button>
                        {/* This is the "true" upload field. It is called by the "Import"-Button */}
                        <input onChange={readImportFile} style={{ display: 'none' }} type="file" id="fileUpload" />
                    </div>
                </div>
                <hr />
            </div>
            <div className={styles.verticalLine}></div>
            <div className={`${styles.sectionRight} ${styles.section}`}>
                <Flip style={{ width: '300px' }} flip={DEMO_FLIP} />
            </div>
        </div>
    )
}

export default React.memo(FlipCustomize)
