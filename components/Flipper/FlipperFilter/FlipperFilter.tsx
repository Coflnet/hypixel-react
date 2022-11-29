import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import FlipRestrictionList from '../FlipRestrictionList/FlipRestrictionList'
import { BallotOutlined as FilterIcon, Settings as SettingsIcon } from '@mui/icons-material'
import { NumericFormat } from 'react-number-format'
import { FLIPPER_FILTER_KEY, FLIP_CUSTOMIZING_KEY, getSettingsObject, mapRestrictionsToApiFormat, setSetting } from '../../../utils/SettingsUtils'
import styles from './FlipperFilter.module.css'
import api from '../../../api/ApiHelper'
import { getDecimalSeperator, getThousandSeperator } from '../../../utils/Formatter'
import { getFlipCustomizeSettings, isCurrentCalculationBasedOnLbin } from '../../../utils/FlipUtils'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import Tooltip from '../../Tooltip/Tooltip'
import FlipCustomize from '../FlipCustomize/FlipCustomize'
import { v4 as generateUUID } from 'uuid'
import { useMatomo } from '@datapunt/matomo-tracker-react'

interface Props {
    onChange(filter: FlipperFilter)
    isLoggedIn?: boolean
    isPremium?: boolean
}

function FlipperFilter(props: Props) {
    let [showRestrictionList, setShowRestrictionList] = useState(false)
    let [isAdvanced, setIsAdvanced] = useState(false)
    let [flipCustomizeSettings, setFlipCustomizeSettings] = useState<FlipCustomizeSettings>({})
    let [flipperFilter, setFlipperFilter] = useState<FlipperFilter>(getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {}))
    let [showCustomizeFlip, setShowCustomizeFlip] = useState(false)
    let [flipCustomizeKey, setFlipCustomizeKey] = useState<string>(generateUUID())

    let { trackEvent } = useMatomo()

    useEffect(() => {
        setFlipCustomizeSettings(getFlipCustomizeSettings())
        setFlipperFilter(getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {}))
        document.addEventListener(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE, e => {
            if ((e as any).detail?.apiUpdate) {
                setFlipCustomizeKey(generateUUID())
            }
            setFlipCustomizeSettings(getFlipCustomizeSettings())
            setFlipperFilter(getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {}))
        })
    }, [])

    let onlyUnsoldRef = useRef(null)

    function onFilterChange(filter: FlipperFilter) {
        if (props.isLoggedIn) {
            let filterToSave = JSON.parse(JSON.stringify(filter))
            if (!props.isPremium) {
                filterToSave.onlyBin = undefined
                filterToSave.onlyUnsold = undefined
            }
            setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter))
        } else {
            setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter))
        }

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))
        props.onChange(filter)
    }

    function onSettingsChange(key: string, value: any, apiKey?: string) {
        let filter = flipperFilter
        filter[key] = value
        api.setFlipSetting(apiKey || key, value)
        setFlipperFilter(flipperFilter)
        onFilterChange(filter)
    }

    function onRestrictionsChange(restrictions: FlipRestriction[], type: 'blacklist' | 'whitelist') {
        api.setFlipSetting(type, mapRestrictionsToApiFormat(restrictions.filter(restriction => restriction.type === type)))
    }

    function numberFieldMaxValue(value: number = 0, maxValue: number) {
        return value <= maxValue
    }

    function onProfitCalculationButtonClick() {
        if (isCurrentCalculationBasedOnLbin(flipCustomizeSettings)) {
            flipCustomizeSettings.finders = [1, 4]
            flipCustomizeSettings.useLowestBinForProfit = false
            api.setFlipSetting('lbin', false)
            api.setFlipSetting('finders', 5)
            trackEvent({
                category: 'customizeFlipStyle',
                action: 'finders: 1,4'
            })
            trackEvent({
                category: 'customizeFlipStyle',
                action: 'lbin: false'
            })
        } else {
            flipCustomizeSettings.finders = [2]
            flipCustomizeSettings.useLowestBinForProfit = true
            api.setFlipSetting('lbin', true)
            api.setFlipSetting('finders', 2)
            trackEvent({
                category: 'customizeFlipStyle',
                action: 'finders: 2'
            })
            trackEvent({
                category: 'customizeFlipStyle',
                action: 'lbin: false'
            })
        }
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(flipCustomizeSettings))
        setFlipCustomizeSettings({ ...flipCustomizeSettings })
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))
    }

    let restrictionListDialog = (
        <Modal
            size={'xl'}
            show={showRestrictionList}
            onHide={() => {
                setShowRestrictionList(false)
            }}
            scrollable={true}
        >
            <Modal.Header closeButton>
                <Modal.Title>Restrict the flip results</Modal.Title>
            </Modal.Header>
            <Modal.Body className={styles.restrictionModal}>
                <FlipRestrictionList onRestrictionsChange={onRestrictionsChange} />
            </Modal.Body>
        </Modal>
    )

    let customizeFlipDialog = (
        <Modal
            size={'xl'}
            show={showCustomizeFlip}
            onHide={() => {
                setShowCustomizeFlip(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Customize the style of flips</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FlipCustomize key={flipCustomizeKey} />
            </Modal.Body>
        </Modal>
    )

    return (
        <div className={styles.flipperFilter}>
            <div className={styles.flipperFilterGroup}>
                <Form.Group className={styles.filterTextfield}>
                    <Tooltip
                        type="hover"
                        content={
                            <Form.Label htmlFor="min-profit" className={`${styles.flipperFilterFormfieldLabel}`}>
                                Min. Profit:
                            </Form.Label>
                        }
                        tooltipContent={
                            <span>
                                How much estimated profit do you at least want from each flip. Note that there is naturally more competition on higher profit
                                flips{' '}
                            </span>
                        }
                    />
                    <NumericFormat
                        id="min-profit"
                        onValueChange={value => {
                            onSettingsChange('minProfit', value.floatValue || 0)
                        }}
                        className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                        type="text"
                        disabled={!props.isLoggedIn}
                        isAllowed={value => {
                            return numberFieldMaxValue(value.floatValue, 2147483647)
                        }}
                        customInput={Form.Control}
                        defaultValue={flipperFilter.minProfit}
                        thousandSeparator={getThousandSeperator()}
                        decimalSeparator={getDecimalSeperator()}
                        allowNegative={false}
                        decimalScale={0}
                    />
                </Form.Group>
                <div
                    onClick={() => {
                        setShowRestrictionList(true)
                    }}
                    className={styles.filterCheckbox}
                    style={{ cursor: 'pointer' }}
                >
                    <span className={styles.filterBorder}>
                        <Tooltip
                            type="hover"
                            content={<span className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>Filter-Rules</span>}
                            tooltipContent={<span>Make custom rules which items should show up and which should not</span>}
                        />
                        <FilterIcon className={styles.flipperFilterFormfield} style={{ marginLeft: '-4px' }} />
                    </span>
                </div>
                <Form.Group className={styles.filterCheckbox}>
                    <Tooltip
                        type="hover"
                        content={
                            <Form.Label
                                htmlFor="onlyBinCheckbox"
                                className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}
                                defaultChecked={flipperFilter.onlyBin}
                            >
                                Only BIN-Auctions
                            </Form.Label>
                        }
                        tooltipContent={
                            flipperFilter.onlyBin ? (
                                <span>Do not show auction flips that are about to end and could be profited from with the current bid</span>
                            ) : (
                                <span>Display auction flips that are about to end and could be profited from with the current bid</span>
                            )
                        }
                    />
                    <Form.Check
                        id="onlyBinCheckbox"
                        onChange={e => {
                            onSettingsChange('onlyBin', e.target.checked)
                        }}
                        defaultChecked={flipperFilter.onlyBin}
                        className={styles.flipperFilterFormfield}
                        type="checkbox"
                    />
                </Form.Group>
                <Form.Group className={styles.filterTextfield}>
                    <Tooltip
                        type="hover"
                        content={<Form.Label className={`${styles.flipperFilterFormfieldLabel}`}>Profit based on</Form.Label>}
                        tooltipContent={
                            isCurrentCalculationBasedOnLbin(flipCustomizeSettings) ? (
                                <span>
                                    Profit is currently based off the lowest bin of similar items. Lbin Flips (also called snipes) will not show if there is no
                                    similar auction on ah. Auctions shown are expected to sell quickly. There is very high competition for these types of
                                    auctions.
                                </span>
                            ) : (
                                <span>
                                    Profit is currently based off the weighted median sell value of similar items (so called references). This is the
                                    recommended setting as it makes the most money over all and prices items based on daily and weekly price swings. But items
                                    may only sell after days.
                                </span>
                            )
                        }
                    />
                    <Button onClick={onProfitCalculationButtonClick}>{isCurrentCalculationBasedOnLbin(flipCustomizeSettings) ? 'lbin' : 'Median'}</Button>
                </Form.Group>
                <Form.Group
                    onClick={() => {
                        setShowCustomizeFlip(true)
                    }}
                    className={styles.filterCheckbox}
                >
                    <span className={styles.filterBorder}>
                        <Tooltip
                            type="hover"
                            content={<span style={{ cursor: 'pointer', marginRight: '10px' }}>Settings</span>}
                            tooltipContent={<span>Edit flip appearance and general settings</span>}
                        />
                        <span style={{ cursor: 'pointer' }}>
                            {' '}
                            <SettingsIcon />
                        </span>
                    </span>
                </Form.Group>
                <Form.Group className={styles.filterCheckbox}>
                    <Tooltip
                        type="hover"
                        content={
                            <Form.Label htmlFor="advancedCheckbox" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                                Advanced
                            </Form.Label>
                        }
                        tooltipContent={<span>Get more advanced config options. (You shouldn&apos;t need them by default)</span>}
                    />
                    <Form.Check
                        id="advancedCheckbox"
                        onChange={e => {
                            setIsAdvanced(e.target.checked)
                        }}
                        className={styles.flipperFilterFormfield}
                        type="checkbox"
                    />
                </Form.Group>
            </div>
            {isAdvanced ? (
                <>
                    <hr />
                    <div className={styles.flipperFilterGroupAdvanced}>
                        <Form.Group className={styles.filterTextfield}>
                            <Form.Label htmlFor="min-profit-percent" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                                Min. Profit (%):
                            </Form.Label>
                            <NumericFormat
                                id="min-profit-percent"
                                onValueChange={value => {
                                    onSettingsChange('minProfitPercent', value.floatValue || 0)
                                }}
                                className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                                disabled={!props.isLoggedIn}
                                isAllowed={value => {
                                    return numberFieldMaxValue(value.floatValue, 2147483647)
                                }}
                                customInput={Form.Control}
                                defaultValue={flipperFilter.minProfitPercent}
                                thousandSeparator={getThousandSeperator()}
                                decimalSeparator={getDecimalSeperator()}
                                allowNegative={false}
                                decimalScale={0}
                            />
                        </Form.Group>
                        <Form.Group className={styles.filterTextfield}>
                            <Tooltip
                                type="hover"
                                content={
                                    <Form.Label htmlFor="min-volume" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                                        Min. Volume:
                                    </Form.Label>
                                }
                                tooltipContent={<span>Minimum average amount of sells in 24 hours</span>}
                            />
                            <NumericFormat
                                id="min-volume"
                                onValueChange={value => {
                                    onSettingsChange('minVolume', value.floatValue || 0)
                                }}
                                className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                                disabled={!props.isLoggedIn}
                                isAllowed={value => {
                                    return numberFieldMaxValue(value.floatValue, 120)
                                }}
                                customInput={Form.Control}
                                defaultValue={flipperFilter.minVolume}
                                thousandSeparator={getThousandSeperator()}
                                decimalSeparator={getDecimalSeperator()}
                                allowNegative={false}
                                decimalScale={1}
                            />
                        </Form.Group>
                        <Form.Group className={styles.filterTextfield}>
                            <Form.Label htmlFor="max-cost" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                                Max. Cost:
                            </Form.Label>
                            <NumericFormat
                                id="max-cost"
                                onValueChange={value => {
                                    onSettingsChange('maxCost', value.floatValue || 0)
                                }}
                                className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                                disabled={!props.isLoggedIn}
                                isAllowed={value => {
                                    return numberFieldMaxValue(value.floatValue, 2147483647)
                                }}
                                customInput={Form.Control}
                                defaultValue={flipperFilter.maxCost}
                                thousandSeparator={getThousandSeperator()}
                                decimalSeparator={getDecimalSeperator()}
                                allowNegative={false}
                                decimalScale={0}
                            />
                        </Form.Group>
                        <Form.Group className={styles.filterCheckbox}>
                            <Form.Label htmlFor="onlyUnsoldCheckbox" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                                Hide SOLD Auctions
                            </Form.Label>
                            <Form.Check
                                ref={onlyUnsoldRef}
                                id="onlyUnsoldCheckbox"
                                onChange={e => {
                                    onSettingsChange('onlyUnsold', e.target.checked, 'showHideSold')
                                }}
                                defaultChecked={flipperFilter.onlyUnsold}
                                className={styles.flipperFilterFormfield}
                                type="checkbox"
                            />
                        </Form.Group>
                    </div>
                </>
            ) : null}
            {restrictionListDialog}
            {customizeFlipDialog}
        </div>
    )
}

export default React.memo(FlipperFilter)
