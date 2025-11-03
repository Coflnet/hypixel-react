'use client'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import React, { ChangeEvent, useEffect, useState, type JSX } from 'react'
import { Button, Form } from 'react-bootstrap'
import { DEMO_FLIP, FLIP_FINDERS, getFlipFinders, getFlipCustomizeSettings } from '../../../utils/FlipUtils'
import {
    FLIPPER_FILTER_KEY,
    FLIP_CUSTOMIZING_KEY,
    getSettingsObject,
    handleSettingsImport,
    mapSettingsToApiFormat,
    RESTRICTIONS_SETTINGS_KEY,
    setSetting
} from '../../../utils/SettingsUtils'
import Tooltip from '../../Tooltip/Tooltip'
import Flip from '../Flip/Flip'
import HelpIcon from '@mui/icons-material/Help'
import Select, { components } from 'react-select'
import FormatElement from './FormatElement/FormatElement'
import SettingCheckbox from './SettingCheckbox/SettingCheckbox'
import styles from './FlipCustomize.module.css'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import PublishedConfigs from './PublishedConfigs/PublishedConfigs'

const customSelectStyle = {
    option: provided => ({
        ...provided,
        color: 'black'
    })
}

function FlipCustomize() {
    let [flipCustomizeSettings, setFlipCustomizeSettings] = useState<FlipCustomizeSettings>({})
    let [isExportDisabled, setIsExportDisabled] = useState(false)
    let { trackEvent } = useMatomo()

    useEffect(() => {
        let settings = getFlipCustomizeSettings()
        setIsExportDisabled(settings.blockExport === true)
        setFlipCustomizeSettings({ ...settings })
        loadPublishedConfigs()
    }, [])

    async function loadPublishedConfigs() {
        let configs = await api.getPublishedConfigs()
    }

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
        let toExport = mapSettingsToApiFormat(
            getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {}),
            getSettingsObject<FlipCustomizeSettings>(FLIP_CUSTOMIZING_KEY, {}),
            getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, [])
        )

        download('filter.json', JSON.stringify(toExport))
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

    function getFlipFinderWarningElement(): JSX.Element | null {
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

        addWarningForFinder('TFM', warnings, 'The "TFM"-Finder is outdated and therefore considered risky. Only use if you know what you are doing.')
        addWarningForFinder(
            'Stonks',
            warnings,
            'The "Stonks"-Finder is work in progress and therefore considered risky. Only use if you know what you are doing.'
        )
        addWarningForFinder(
            'CraftCost',
            warnings,
            'The "CraftCost"-Finder sums up craft cost. It does not mean its estimations are correct, please report any cases where you know they are not.'
        )

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
                <Tooltip
                    type={'hover'}
                    content={<span style={props.innerProps.css}>{props.children}</span>}
                    tooltipContent={<span>{props.data.description}</span>}
                />
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
                        <SettingCheckbox
                            id="hideCost"
                            label="Cost"
                            apiKey="showCost"
                            settingKey="hideCost"
                            defaultChecked={!flipCustomizeSettings.hideCost}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
                        <SettingCheckbox
                            id="hideEstimatedProfit"
                            label="Estimated Profit"
                            apiKey="showEstProfit"
                            settingKey="hideEstimatedProfit"
                            defaultChecked={!flipCustomizeSettings.hideEstimatedProfit}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
                        <SettingCheckbox
                            id="hideSecondLowestBin"
                            label="Second lowest BIN"
                            apiKey="showSlbin"
                            settingKey="hideSecondLowestBin"
                            defaultChecked={!flipCustomizeSettings.hideSecondLowestBin}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
                        <SettingCheckbox
                            id="hideVolume"
                            label="Volume"
                            apiKey="showVolume"
                            settingKey="hideVolume"
                            defaultChecked={!flipCustomizeSettings.hideVolume}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
                        <SettingCheckbox
                            id="shortNumbers"
                            label="Shorten numbers?"
                            apiKey="modShortNumbers"
                            settingKey="shortNumbers"
                            defaultChecked={!!flipCustomizeSettings.shortNumbers}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
                        <SettingCheckbox
                            id="hideProfitPercent"
                            label="Profit percent?"
                            apiKey="showProfitPercent"
                            settingKey="hideProfitPercent"
                            defaultChecked={!flipCustomizeSettings.hideProfitPercent}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
                        <SettingCheckbox
                            id="hideProfit"
                            label="Profit (absolute)"
                            apiKey="showProfit"
                            settingKey="hideProfit"
                            defaultChecked={!flipCustomizeSettings.hideProfit}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
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
                        <SettingCheckbox
                            id="hideMedianPrice"
                            label="Median price"
                            apiKey="showMedPrice"
                            settingKey="hideMedianPrice"
                            defaultChecked={!flipCustomizeSettings.hideMedianPrice}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
                        <SettingCheckbox
                            id="hideLowestBin"
                            label="Lowest BIN"
                            apiKey="showLbin"
                            settingKey="hideLowestBin"
                            defaultChecked={!flipCustomizeSettings.hideLowestBin}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
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
                        <SettingCheckbox
                            id="hideCopySuccessMessage"
                            label="Show copy message"
                            apiKey="showCopySuccessMessage"
                            settingKey="hideCopySuccessMessage"
                            defaultChecked={!flipCustomizeSettings.hideCopySuccessMessage}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
                        <SettingCheckbox
                            id="disableLinks"
                            label="Disable links"
                            apiKey="showLinks"
                            settingKey="disableLinks"
                            defaultChecked={!!flipCustomizeSettings.disableLinks}
                            inverted={true}
                            labelClass={styles.label}
                            updateApiSetting={updateApiSetting}
                            setFlipCustomizeSetting={setFlipCustomizeSetting}
                        />
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
                                defaultChecked={!!flipCustomizeSettings.useLowestBinForProfit}
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
                            <SettingCheckbox
                                id="justProfit"
                                label="Just show profit"
                                apiKey="modJustProfit"
                                settingKey="justProfit"
                                defaultChecked={!!flipCustomizeSettings.justProfit}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="blockTenSecMsg"
                                label='"Flips in 10 seconds"'
                                apiKey="modBlockTenSecMsg"
                                settingKey="blockTenSecMsg"
                                defaultChecked={!flipCustomizeSettings.blockTenSecMsg}
                                inverted={true}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="hideSellerOpenBtn"
                                label="Seller AH Button"
                                apiKey="showSellerOpenBtn"
                                settingKey="hideSellerOpenBtn"
                                defaultChecked={!flipCustomizeSettings.hideSellerOpenBtn}
                                inverted={true}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="modCountdown"
                                label="Countdown"
                                apiKey="modCountdown"
                                settingKey="modCountdown"
                                defaultChecked={!!flipCustomizeSettings.modCountdown}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                        </div>
                        <div>
                            <SettingCheckbox
                                id="soundOnFlip"
                                label="Play flip sound"
                                apiKey="modSoundOnFlip"
                                settingKey="soundOnFlip"
                                defaultChecked={!!flipCustomizeSettings.soundOnFlip}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="hideModChat"
                                label="Mod Chat"
                                apiKey="modChat"
                                settingKey="hideModChat"
                                defaultChecked={!flipCustomizeSettings.hideModChat}
                                inverted={true}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="hideLore"
                                label="Item lore (on hover)"
                                apiKey="showLore"
                                settingKey="hideLore"
                                defaultChecked={!flipCustomizeSettings.hideLore}
                                inverted={true}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="soundOnOutbid"
                                label="Play sound on outbid"
                                apiKey="modSoundOnOutbid"
                                settingKey="soundOnOutbid"
                                defaultChecked={!!flipCustomizeSettings.soundOnOutbid}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="shortNames"
                                label="Short names (no reforges)"
                                apiKey="modShortNames"
                                settingKey="shortNames"
                                defaultChecked={!!flipCustomizeSettings.shortNames}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                        </div>
                    </Form>
                    <div style={{ marginLeft: '30px', marginRight: '30px' }}>
                        <FormatElement onChange={onModFormatChange} settings={flipCustomizeSettings} labelClass={styles.label} />
                    </div>
                    <h6 style={{ marginTop: '20px', marginLeft: '30px' }}>Additional Mod Settings</h6>
                    <Form className={styles.section}>
                        <div>
                            <SettingCheckbox
                                id="hideNoBestFlip"
                                label='Hide "No best flip" msg'
                                apiKey="modHideNoBestFlip"
                                settingKey="hideNoBestFlip"
                                defaultChecked={!!flipCustomizeSettings.hideNoBestFlip}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="streamerMode"
                                label="Streamer mode"
                                apiKey="modStreamerMode"
                                settingKey="streamerMode"
                                defaultChecked={!!flipCustomizeSettings.streamerMode}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="normalSoldFlips"
                                label="Normal sold flips"
                                apiKey="modNormalSoldFlips"
                                settingKey="normalSoldFlips"
                                defaultChecked={!!flipCustomizeSettings.normalSoldFlips}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                        </div>
                        <div>
                            <SettingCheckbox
                                id="hideSoldAuction"
                                label="Hide sold auctions"
                                apiKey="showHideSold"
                                settingKey="hideSoldAuction"
                                defaultChecked={!!flipCustomizeSettings.hideSoldAuction}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="hideManipulated"
                                label="Hide manipulated items"
                                apiKey="showHideManipulated"
                                settingKey="hideManipulated"
                                defaultChecked={!!flipCustomizeSettings.hideManipulated}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="autoStartFlipper"
                                label="Auto start flipper"
                                apiKey="modAutoStartFlipper"
                                settingKey="autoStartFlipper"
                                defaultChecked={!!flipCustomizeSettings.autoStartFlipper}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="quickSell"
                                label="Quick sell"
                                apiKey="modQuickSell"
                                settingKey="quickSell"
                                defaultChecked={!!flipCustomizeSettings.quickSell}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="disableSpamProtection"
                                label="Disable spam protection"
                                apiKey="modDisableSpamProtection"
                                settingKey="disableSpamProtection"
                                defaultChecked={!!flipCustomizeSettings.disableSpamProtection}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="tempBlacklistSpam"
                                label="Temp blacklist spam"
                                apiKey="modTempBlacklistSpam"
                                settingKey="tempBlacklistSpam"
                                defaultChecked={!!flipCustomizeSettings.tempBlacklistSpam}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="dataOnlyMode"
                                label="Data only mode"
                                apiKey="modDataOnlyMode"
                                settingKey="dataOnlyMode"
                                defaultChecked={!!flipCustomizeSettings.dataOnlyMode}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                            <SettingCheckbox
                                id="noBedDelay"
                                label="No bed delay"
                                apiKey="modNoBedDelay"
                                settingKey="noBedDelay"
                                defaultChecked={!!flipCustomizeSettings.noBedDelay}
                                labelClass={styles.label}
                                updateApiSetting={updateApiSetting}
                                setFlipCustomizeSetting={setFlipCustomizeSetting}
                            />
                        </div>
                    </Form>
                    <h6 style={{ marginTop: '20px', marginLeft: '30px' }}>Numeric Mod Settings</h6>
                    <Form className={styles.section}>
                        <div>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="maxPercentOfPurse">
                                    Max % of purse
                                </Form.Label>
                                <Form.Control
                                    min={0}
                                    max={100}
                                    onChange={event => {
                                        const value = parseInt(event.target.value) || 0
                                        api.setFlipSetting('modMaxPercentOfPurse', value)
                                        setFlipCustomizeSetting('maxPercentOfPurse', value)
                                        trackChange('maxPercentOfPurse')
                                    }}
                                    defaultValue={flipCustomizeSettings.maxPercentOfPurse}
                                    type="number"
                                    id="maxPercentOfPurse"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="maxItemsInInventory">
                                    Max flip items in inventory
                                </Form.Label>
                                <Form.Control
                                    min={0}
                                    max={999}
                                    onChange={event => {
                                        const value = parseInt(event.target.value) || 0
                                        api.setFlipSetting('modMaxItemsInInventory', value)
                                        setFlipCustomizeSetting('maxItemsInInventory', value)
                                        trackChange('maxItemsInInventory')
                                    }}
                                    defaultValue={flipCustomizeSettings.maxItemsInInventory}
                                    type="number"
                                    id="maxItemsInInventory"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="tempBlacklistThreshold">
                                    Temp blacklist threshold (%)
                                </Form.Label>
                                <Form.Control
                                    min={0}
                                    max={100}
                                    onChange={event => {
                                        const value = parseInt(event.target.value) || 0
                                        api.setFlipSetting('modTempBlacklistThreshold', value)
                                        setFlipCustomizeSetting('tempBlacklistThreshold', value)
                                        trackChange('tempBlacklistThreshold')
                                    }}
                                    defaultValue={flipCustomizeSettings.tempBlacklistThreshold}
                                    type="number"
                                    id="tempBlacklistThreshold"
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="ahListHours">
                                    AH list hours
                                </Form.Label>
                                <Form.Control
                                    min={0}
                                    max={48}
                                    onChange={event => {
                                        const value = parseInt(event.target.value) || 0
                                        api.setFlipSetting('modAhListHours', value)
                                        setFlipCustomizeSetting('ahListHours', value)
                                        trackChange('ahListHours')
                                    }}
                                    defaultValue={flipCustomizeSettings.ahListHours}
                                    type="number"
                                    id="ahListHours"
                                />
                            </Form.Group>
                        </div>
                        <div>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="blockedMsg">
                                    Minutes between blocked msgs
                                </Form.Label>
                                <Form.Control
                                    min={0}
                                    max={127}
                                    onChange={event => {
                                        const value = parseInt(event.target.value) || 0
                                        api.setFlipSetting('modBlockedMsg', value)
                                        setFlipCustomizeSetting('blockedMsg', value)
                                        trackChange('blockedMsg')
                                    }}
                                    defaultValue={flipCustomizeSettings.blockedMsg}
                                    type="number"
                                    id="blockedMsg"
                                />
                            </Form.Group>
                        </div>
                    </Form>
                    <div style={{ marginLeft: '30px', marginRight: '30px', marginTop: '15px' }}>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="blockedFormat">
                                Blocked format
                            </Form.Label>
                            <Form.Control
                                onChange={event => {
                                    const value = event.target.value
                                    api.setFlipSetting('modBlockedFormat', value)
                                    setFlipCustomizeSetting('blockedFormat', value)
                                    trackChange('blockedFormat')
                                }}
                                defaultValue={flipCustomizeSettings.blockedFormat}
                                type="text"
                                id="blockedFormat"
                                placeholder="Custom format for blocked flips"
                            />
                        </Form.Group>
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
                        <Tooltip
                            type="hover"
                            content={
                                <div style={{ width: '40%', marginRight: 0 }}>
                                    <Button onClick={exportFilter} disabled={isExportDisabled} style={{ width: '100%' }}>
                                        Export
                                    </Button>
                                </div>
                            }
                            tooltipContent={
                                isExportDisabled ? <p>Your settings can't be exported, likely because they are based on a config you bought</p> : undefined
                            }
                        />
                        {/* This is the "true" upload field. It is called by the "Import"-Button */}
                        <input onChange={readImportFile} style={{ display: 'none' }} type="file" id="fileUpload" />
                    </div>
                    <Form.Group style={{ marginTop: 15 }}>
                        <Form.Check
                            onChange={() => {
                                let wasDisabled = localStorage.getItem('disableRiskyFinderImportProtection') === 'true'
                                localStorage.setItem('disableRiskyFinderImportProtection', (!wasDisabled).toString())
                            }}
                            defaultChecked={localStorage.getItem('disableRiskyFinderImportProtection') !== 'true'}
                            id="riskyFinderProtection"
                            style={{ display: 'inline', marginRight: 10 }}
                            type="checkbox"
                        />
                        <Form.Label className={styles.label} htmlFor="riskyFinderProtection">
                            Risky finder protection{' '}
                            <Tooltip
                                type="hover"
                                content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer' }} />}
                                tooltipContent={
                                    <span>This setting disables risky finders when importing settings. Only disable this if you know what you are doing!</span>
                                }
                            />
                        </Form.Label>
                    </Form.Group>
                </div>
                <hr />
                <PublishedConfigs />
            </div>
            <div className={styles.verticalLine}></div>
            <div className={`${styles.sectionRight} ${styles.section}`}>
                <Flip style={{ width: '300px' }} flip={DEMO_FLIP} />
            </div>
        </div>
    )

    function addWarningForFinder(name: string, warnings: string[], warning: string) {
        let craftCostFinder = FLIP_FINDERS.find(finder => finder.label === name)
        if (flipCustomizeSettings?.finders?.find(finder => finder.toString() === craftCostFinder?.value)) {
            warnings.push(warning)
        }
    }
}

export default React.memo(FlipCustomize)
