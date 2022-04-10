import { useMatomo } from '@datapunt/matomo-tracker-react'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { DEMO_FLIP, FLIP_FINDERS, getFlipFinders, getFlipCustomizeSettings } from '../../../utils/FlipUtils'
import { FLIPPER_FILTER_KEY, FLIP_CUSTOMIZING_KEY, getSetting, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils'
import Tooltip from '../../Tooltip/Tooltip'
import Flip from '../Flip/Flip'
import { Help as HelpIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import Select, { components } from 'react-select'
import FormatElement from './FormatElement/FormatElement'
import styles from './FlipCustomize.module.css'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'

const customSelectStyle = {
    option: provided => ({
        ...provided,
        color: 'black'
    })
}

function FlipCustomize() {
    let [flipCustomizeSettings, _setFlipCustomizeSettings] = useState<FlipCustomizeSettings>({})
    let { trackEvent } = useMatomo()

    useEffect(() => {
        _setFlipCustomizeSettings(getFlipCustomizeSettings())
    }, [])

    function setFlipCustomizeSettings(settings: FlipCustomizeSettings) {
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(settings))
        _setFlipCustomizeSettings({ ...settings })
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))
    }

    function onChangeBoolean(key: string, value: boolean) {
        flipCustomizeSettings[key] = value
        setFlipCustomizeSettings(flipCustomizeSettings)
        trackChange(key)
    }

    function onMaxExtraInfoFieldsChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.maxExtraInfoFields = event.target.valueAsNumber
        setFlipCustomizeSettings(flipCustomizeSettings)

        trackChange('maxExtraInfoFields')
    }

    function onUseLowestBinForProfitChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.useLowestBinForProfit = event.target.checked
        setFlipCustomizeSettings(flipCustomizeSettings)

        trackChange('useLowestBinForProfit')
    }

    function onDisableLinksChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.disableLinks = event.target.checked
        setFlipCustomizeSettings(flipCustomizeSettings)

        trackChange('disableLinks')
    }

    function onJustProfitChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.justProfit = event.target.checked
        setFlipCustomizeSettings(flipCustomizeSettings)

        trackChange('justProfit')
    }

    function onSoundOnFlipChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.soundOnFlip = event.target.checked
        setFlipCustomizeSettings(flipCustomizeSettings)

        trackChange('soundOnFlip')
    }

    function onShortNumbersChange(event: ChangeEvent<HTMLInputElement>) {
        flipCustomizeSettings.shortNumbers = event.target.checked
        setFlipCustomizeSettings(flipCustomizeSettings)

        trackChange('shortNumbers')
    }

    function onFindersChange(newValue) {
        flipCustomizeSettings.finders = newValue.map(value => value.value)
        setFlipCustomizeSettings(flipCustomizeSettings)

        trackChange('finders')
    }

    function onModFormatChange(value: string) {
        flipCustomizeSettings.modFormat = value
        setFlipCustomizeSettings(flipCustomizeSettings)

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
                handleFilterImport(output)
            } //end onload()
            reader.readAsText(e.target.files[0])
        }
        return true
    }

    function handleFilterImport(importString: string) {
        let filter: FlipperFilter
        let flipCustomizeSettings: FlipCustomizeSettings
        let restrictions: FlipRestriction[]
        try {
            let importObject = JSON.parse(importString)
            filter = importObject[FLIPPER_FILTER_KEY] ? JSON.parse(importObject[FLIPPER_FILTER_KEY]) : {}
            flipCustomizeSettings = importObject[FLIP_CUSTOMIZING_KEY] ? JSON.parse(importObject[FLIP_CUSTOMIZING_KEY]) : {}
            restrictions = importObject[RESTRICTIONS_SETTINGS_KEY] ? JSON.parse(importObject[RESTRICTIONS_SETTINGS_KEY]) : []
        } catch {
            toast.error('The import of the filter settings failed. Please make sure this is a valid filter file.')
            return
        }

        setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter))
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(flipCustomizeSettings))
        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(restrictions))

        window.location.reload()
    }

    function getFlipFinderWarningElement(): JSX.Element {
        if (!flipCustomizeSettings.useLowestBinForProfit) {
            return <></>
        }
        let sniperFinder = FLIP_FINDERS.find(finder => finder.label === 'Sniper')
        if (!sniperFinder) {
            console.error("Finder with label 'Sniper' not found")
            return <></>
        }
        if (
            !flipCustomizeSettings.finders ||
            flipCustomizeSettings.finders.length === 0 ||
            flipCustomizeSettings.finders.length > 1 ||
            flipCustomizeSettings.finders[0].toString() !== sniperFinder.value
        ) {
            return (
                <b>
                    <p style={{ color: 'red' }}>
                        Only use the "Sniper"-Finder with 'Use lbin to calculate profit option'. Using other finders may leed to muliple seconds of delay as
                        this will require additional calculations.
                    </p>
                </b>
            )
        } else {
            return <></>
        }
    }

    const useLowestBinHelpElement = (
        <p>
            By enabling this setting, the lowest BIN is used as the estimated selling price to calculate your profit. That can lead to profitable flips being
            estimated way too low (even as a loss). We recommend using the median to calculate the profit.
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
                                onChange={event => onChangeBoolean('hideCost', !event.target.checked)}
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
                                onChange={event => onChangeBoolean('hideEstimatedProfit', !event.target.checked)}
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
                                onChange={event => onChangeBoolean('hideSecondLowestBin', !event.target.checked)}
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
                                onChange={event => onChangeBoolean('hideVolume', !event.target.checked)}
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
                                onChange={onShortNumbersChange}
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
                                onChange={event => onChangeBoolean('hideProfitPercent', !event.target.checked)}
                                defaultChecked={!flipCustomizeSettings.hideProfitPercent}
                                id="profitPercent"
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
                                onChange={event => onChangeBoolean('hideMedianPrice', !event.target.checked)}
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
                                onChange={event => onChangeBoolean('hideLowestBin', !event.target.checked)}
                                defaultChecked={!flipCustomizeSettings.hideLowestBin}
                                id="hideLowestBin"
                                style={{ display: 'inline' }}
                                type="checkbox"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className={styles.label} htmlFor="hideSeller">
                                Seller
                            </Form.Label>
                            <Form.Check
                                onChange={event => onChangeBoolean('hideSeller', !event.target.checked)}
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
                                onChange={event => onChangeBoolean('hideCopySuccessMessage', !event.target.checked)}
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
                                onChange={onDisableLinksChange}
                                defaultChecked={flipCustomizeSettings.disableLinks}
                                id="hideCopyMessage"
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
                                onChange={onUseLowestBinForProfitChange}
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
                        options={FLIP_FINDERS}
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
                                    onChange={onJustProfitChange}
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
                                    onChange={event => onChangeBoolean('blockTenSecMsg', !event.target.checked)}
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
                                    onChange={event => onChangeBoolean('hideSellerOpenBtn', !event.target.checked)}
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
                                    onChange={event => onChangeBoolean('modCountdown', !event.target.checked)}
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
                                    onChange={onSoundOnFlipChange}
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
                                    onChange={event => onChangeBoolean('hideModChat', !event.target.checked)}
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
                                    onChange={event => onChangeBoolean('hideLore', !event.target.checked)}
                                    defaultChecked={!flipCustomizeSettings.hideLore}
                                    id="hideLore"
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
