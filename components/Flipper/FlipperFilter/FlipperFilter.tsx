'use client'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import FilterIcon from '@mui/icons-material/BallotOutlined'
import SettingsIcon from '@mui/icons-material/Settings'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import { NumericFormat } from 'react-number-format'
import { v4 as generateUUID } from 'uuid'
import api from '../../../api/ApiHelper'
import { getCurrentProfitCalculationState } from '../../../utils/FlipUtils'
import { getDecimalSeparator, getThousandSeparator } from '../../../utils/Formatter'
import {
    FLIPPER_FILTER_KEY,
    FLIP_CUSTOMIZING_KEY,
    ITEM_FILER_SHOW_ADVANCED,
    getSetting,
    mapRestrictionsToApiFormat,
    setSetting
} from '../../../utils/SettingsUtils'
import Tooltip from '../../Tooltip/Tooltip'
import FlipCustomize from '../FlipCustomize/FlipCustomize'
import FlipRestrictionList from '../FlipRestrictionList/FlipRestrictionList'
import styles from './FlipperFilter.module.css'
import { getURLSearchParam } from '../../../utils/Parser/URLParser'
import { RestrictionCreateState } from '../FlipRestrictionList/NewRestriction/NewRestriction'
import { isValidTokenAvailable } from '../../GoogleSignIn/GoogleSignIn'
import { useFlipSettings } from '../../Providers/FlipSettingsProvider'

interface Props {
    onChange(filter: FlipperFilter)
    isLoggedIn?: boolean
    isPremium?: boolean
}

function FlipperFilter(props: Props) {
    const { flipperFilter: contextFlipperFilter, flipCustomizeSettings: contextFlipCustomizeSettings, refreshSettings } = useFlipSettings()
    
    let [prefillRestriction] = useState<RestrictionCreateState>(
        getURLSearchParam('prefillRestriction') ? JSON.parse(getURLSearchParam('prefillRestriction')!) : undefined
    )
    let [showRestrictionList, setShowRestrictionList] = useState(!!prefillRestriction)
    let [isAdvanced, setIsAdvanced] = useState(getSetting(ITEM_FILER_SHOW_ADVANCED, 'false') === 'true')
    let [localFlipCustomizeSettings, setLocalFlipCustomizeSettings] = useState<FlipCustomizeSettings>(contextFlipCustomizeSettings)
    let [localFlipperFilter, setLocalFlipperFilter] = useState<FlipperFilter>(contextFlipperFilter)
    let [showCustomizeFlip, setShowCustomizeFlip] = useState(false)
    let [flipCustomizeKey, setFlipCustomizeKey] = useState<string>(generateUUID())
    let [isSSR, setIsSSR] = useState(true)

    let disabled = isSSR ? true : !props.isLoggedIn && isValidTokenAvailable(localStorage.getItem('googleId'))

    let { trackEvent } = useMatomo()

    useEffect(() => {
        setLocalFlipCustomizeSettings(contextFlipCustomizeSettings)
        setLocalFlipperFilter(contextFlipperFilter)
        setIsSSR(false)
    }, [contextFlipCustomizeSettings, contextFlipperFilter])

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

        setLocalFlipperFilter(filter)
        refreshSettings()
        props.onChange(filter)
    }

    function onSettingsChange(key: string, value: any, apiKey?: string) {
        let filter = { ...localFlipperFilter }
        filter[key] = value
        api.setFlipSetting(apiKey || key, value)
        onFilterChange(filter)
    }

    let onRestrictionsChange = useCallback((restrictions: FlipRestriction[], type: 'blacklist' | 'whitelist') => {
        api.setFlipSetting(type, mapRestrictionsToApiFormat(restrictions.filter(restriction => restriction.type === type)))
    }, [])

    function numberFieldMaxValue(value: number = 0, maxValue: number) {
        return value <= maxValue
    }

    function onProfitCalculationButtonClick() {
        let flipPriceCalculationState = getCurrentProfitCalculationState(localFlipCustomizeSettings)
        let newSettings = { ...localFlipCustomizeSettings }

        if (flipPriceCalculationState === 'lbin' || flipPriceCalculationState === 'custom') {
            newSettings.finders = [1, 4]
            newSettings.useLowestBinForProfit = false
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
            newSettings.finders = [2]
            newSettings.useLowestBinForProfit = true
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
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(newSettings))
        setLocalFlipCustomizeSettings(newSettings)
        refreshSettings()
    }

    const debounceMinProfitChangeFunction = (function () {
        let timerId

        return (minProfit: number) => {
            clearTimeout(timerId)
            timerId = setTimeout(() => {
                onSettingsChange('minProfit', minProfit || 0)
            }, 1000)
        }
    })()

    let restrictionListDialog = (
        <Modal
            size={'xl'}
            show={showRestrictionList && !disabled}
            onHide={() => {
                setShowRestrictionList(false)
            }}
            scrollable={true}
            contentClassName={styles.restrictionListContent}
        >
            <Modal.Header closeButton>
                <Modal.Title>Restrict the flip results</Modal.Title>
            </Modal.Header>
            <Modal.Body className={styles.restrictionModal}>
                <FlipRestrictionList onRestrictionsChange={onRestrictionsChange} prefillRestriction={prefillRestriction} />
            </Modal.Body>
        </Modal>
    )

    let customizeFlipDialog = (
        <Modal
            size={'xl'}
            show={showCustomizeFlip && !disabled}
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

    let flipPriceCalculationState = getCurrentProfitCalculationState(localFlipCustomizeSettings)

    return (
        <div className={styles.localFlipperFilter}>
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
                            debounceMinProfitChangeFunction(value.floatValue || 0)
                        }}
                        placeholder={!props.isLoggedIn ? 'Please login first' : undefined}
                        className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                        type="text"
                        disabled={!props.isLoggedIn}
                        isAllowed={value => {
                            return numberFieldMaxValue(value.floatValue, 10000000000)
                        }}
                        customInput={Form.Control}
                        defaultValue={localFlipperFilter.minProfit}
                        thousandSeparator={getThousandSeparator()}
                        decimalSeparator={getDecimalSeparator()}
                        allowNegative={false}
                        decimalScale={0}
                    />
                </Form.Group>
                <div
                    onClick={() => {
                        if (disabled) return
                        setShowRestrictionList(true)
                    }}
                    className={styles.filterCheckbox}
                    style={{ cursor: 'pointer' }}
                >
                    <span className={styles.filterBorder}>
                        <Tooltip
                            type="hover"
                            content={<span className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>Filter Rules</span>}
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
                                defaultChecked={localFlipperFilter.onlyBin}
                            >
                                Only BIN Auctions
                            </Form.Label>
                        }
                        tooltipContent={
                            <span>
                                {localFlipperFilter.onlyBin ? 'Do not display' : 'Display'} auction flips that are about to end and could be profited from with the
                                current bid
                            </span>
                        }
                    />
                    <Form.Check
                        id="onlyBinCheckbox"
                        onChange={e => {
                            onSettingsChange('onlyBin', e.target.checked)
                        }}
                        disabled={disabled}
                        defaultChecked={localFlipperFilter.onlyBin}
                        className={styles.flipperFilterFormfield}
                        type="checkbox"
                    />
                </Form.Group>
                <Form.Group className={styles.filterTextfield}>
                    <Tooltip
                        type="hover"
                        content={<Form.Label className={`${styles.flipperFilterFormfieldLabel}`}>Profit based on</Form.Label>}
                        tooltipContent={
                            flipPriceCalculationState === 'lbin' ? (
                                <span>
                                    Profit is currently based off the lowest bin of similar items. Lbin Flips (also called snipes) will not show if there is no
                                    similar auction on ah. Auctions shown are expected to sell quickly. There is very high competition for these types of
                                    auctions.
                                </span>
                            ) : flipPriceCalculationState === 'median' ? (
                                <span>
                                    Profit is currently based off the weighted median sell value of similar items (so called references). This is the
                                    recommended setting as it makes the most money over all and prices items based on daily and weekly price swings. But items
                                    may only sell after days.
                                </span>
                            ) : undefined
                        }
                    />
                    <Button onClick={onProfitCalculationButtonClick}>
                        {flipPriceCalculationState === 'lbin' ? 'Lowest BIN' : flipPriceCalculationState === 'median' ? 'Median' : 'Custom'}
                    </Button>
                </Form.Group>
                <Form.Group
                    onClick={() => {
                        if (disabled) return
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
                        tooltipContent={<span>Get more advanced config options. (You shouldn't need them by default)</span>}
                    />
                    <Form.Check
                        id="advancedCheckbox"
                        onChange={e => {
                            setIsAdvanced(e.target.checked)
                            setSetting(ITEM_FILER_SHOW_ADVANCED, e.target.checked.toString())
                        }}
                        checked={isAdvanced}
                        disabled={disabled}
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
                            <Tooltip
                                type="hover"
                                content={
                                    <Form.Label htmlFor="min-profit-percent" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                                        Min. Profit (%):
                                    </Form.Label>
                                }
                                tooltipContent={
                                    <span>
                                        A 94m item worth an estimated 100m would have 3m (3%) estimated profit. This includes a total of 3% ah tax and would
                                        block any flip below the value chosen, using 2% would show the flip
                                    </span>
                                }
                            />
                            <NumericFormat
                                id="min-profit-percent"
                                onValueChange={value => {
                                    onSettingsChange('minProfitPercent', value.floatValue || 0)
                                }}
                                className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                                disabled={!props.isLoggedIn}
                                placeholder={!props.isLoggedIn ? 'Please login first' : undefined}
                                isAllowed={value => {
                                    return numberFieldMaxValue(value.floatValue, 10000000000)
                                }}
                                customInput={Form.Control}
                                defaultValue={localFlipperFilter.minProfitPercent}
                                thousandSeparator={getThousandSeparator()}
                                decimalSeparator={getDecimalSeparator()}
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
                                placeholder={!props.isLoggedIn ? 'Please login first' : undefined}
                                isAllowed={value => {
                                    return numberFieldMaxValue(value.floatValue, 120)
                                }}
                                customInput={Form.Control}
                                defaultValue={localFlipperFilter.minVolume}
                                thousandSeparator={getThousandSeparator()}
                                decimalSeparator={getDecimalSeparator()}
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
                                placeholder={!props.isLoggedIn ? 'Please login first' : undefined}
                                isAllowed={value => {
                                    return numberFieldMaxValue(value.floatValue, 10000000000)
                                }}
                                customInput={Form.Control}
                                defaultValue={localFlipperFilter.maxCost}
                                thousandSeparator={getThousandSeparator()}
                                decimalSeparator={getDecimalSeparator()}
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
                                defaultChecked={localFlipperFilter.onlyUnsold}
                                className={styles.flipperFilterFormfield}
                                type="checkbox"
                                disabled={disabled}
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
