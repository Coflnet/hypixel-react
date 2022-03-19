import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Form, Modal } from 'react-bootstrap'
import Tooltip from '../../Tooltip/Tooltip'
import Countdown, { zeroPad } from 'react-countdown'
import { v4 as generateUUID } from 'uuid'
import FlipRestrictionList from '../FlipRestrictionList/FlipRestrictionList'
import { BallotOutlined as FilterIcon } from '@mui/icons-material'
import AutoNumeric from 'autonumeric'
import { FLIPPER_FILTER_KEY, getSettingsObject, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils'
import styles from './FlipperFilter.module.css'
import { isClientSideRendering } from '../../../utils/SSRUtils'

interface Props {
    onChange(filter: FlipperFilter)
    isLoggedIn?: boolean
    isPremium?: boolean
}

let FREE_PREMIUM_SPAN = 1000 * 60 * 5
let FREE_LOGIN_SPAN = 1000 * 60 * 6

let FREE_PREMIUM_FILTER_TIME = new Date().getTime() + FREE_PREMIUM_SPAN
let FREE_LOGIN_FILTER_TIME = new Date().getTime() + FREE_LOGIN_SPAN

let defaultFilter: FlipperFilter

function FlipperFilter(props: Props) {
    if (!defaultFilter) {
        defaultFilter = getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {})
    }

    let [onlyBin, setOnlyBin] = useState(defaultFilter.onlyBin)
    let [onlyUnsold, setOnlyUnsold] = useState(props.isPremium == null ? false : defaultFilter.onlyUnsold || false)
    let [minProfit, setMinProfit] = useState(defaultFilter.minProfit)
    let [minProfitPercent, setMinProfitPercent] = useState(defaultFilter.minProfitPercent)
    let [minVolume, setMinVolume] = useState(defaultFilter.minVolume)
    let [maxCost, setMaxCost] = useState<number>(defaultFilter.maxCost || 2147483647)
    let [freePremiumFilters, setFreePremiumFilters] = useState(false)
    let [freeLoginFilters, setFreeLoginFilters] = useState(false)
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>(getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []))
    let [uuids, setUUIDs] = useState<string[]>([])
    let [showRestrictionList, setShowRestrictionList] = useState(false)

    let onlyUnsoldRef = useRef(null)

    useEffect(() => {
        let newUuids: string[] = []
        for (let index = 0; index < 10; index++) {
            newUuids.push(generateUUID())
        }
        setUUIDs(newUuids)
        FREE_PREMIUM_FILTER_TIME = new Date().getTime() + FREE_PREMIUM_SPAN
        FREE_LOGIN_FILTER_TIME = new Date().getTime() + FREE_LOGIN_SPAN

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    checkAutoNumeric()

    function checkAutoNumeric() {
        if (!isClientSideRendering()) {
            return
        }

        let autoNumericElements = [
            {
                id: 'filter-input-min-profit',
                stateName: 'minProfit',
                maximumValue: '2147483647'
            },
            {
                id: 'filter-input-min-volume',
                stateName: 'minVolume',
                maximumValue: '120'
            },
            {
                id: 'filter-input-max-cost',
                stateName: 'maxCost',
                maximumValue: '2147483647'
            },
            {
                id: 'filter-input-min-volume-percent',
                stateName: 'minProfitPercent'
            }
        ]

        autoNumericElements.forEach(autoNumericElement => {
            let element = document.getElementById(autoNumericElement.id)
            if (element && !AutoNumeric.isManagedByAutoNumeric(element)) {
                // set value to the maxValue if it would exceed the limit
                if (defaultFilter[autoNumericElement.stateName] && autoNumericElement.maximumValue) {
                    if (parseInt(autoNumericElement.maximumValue) < defaultFilter[autoNumericElement.stateName]) {
                        defaultFilter[autoNumericElement.stateName] = parseInt(autoNumericElement.maximumValue)
                    }
                }

                // set value to maxValue if nothing else is set
                if (!defaultFilter[autoNumericElement.stateName] && autoNumericElement.stateName === 'maxCost') {
                    defaultFilter[autoNumericElement.stateName] = 2147483647
                }

                new AutoNumeric('#' + autoNumericElement.id, defaultFilter[autoNumericElement.stateName], {
                    digitGroupSeparator: '.',
                    decimalCharacter: ',',
                    decimalPlaces: 0,
                    emptyInputBehavior: 'zero',
                    minimumValue: '0',
                    maximumValue: autoNumericElement.maximumValue || '10000000000000'
                })
            }
        })
    }

    function getCurrentFilter(): FlipperFilter {
        return {
            onlyBin: onlyBin,
            minProfit: minProfit,
            maxCost: maxCost,
            minProfitPercent: minProfitPercent,
            onlyUnsold: onlyUnsold,
            minVolume: minVolume,
            restrictions: restrictions
        }
    }

    function onFilterChange(filter: FlipperFilter) {
        if (props.isLoggedIn) {
            let filterToSave = JSON.parse(JSON.stringify(filter))
            if (!props.isPremium) {
                filterToSave.onlyBin = undefined
                filterToSave.onlyUnsold = undefined
            }

            setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter))
        } else {
            setSetting(FLIPPER_FILTER_KEY, JSON.stringify({}))
        }

        props.onChange(filter)
    }

    function onOnlyBinChange(event: ChangeEvent<HTMLInputElement>) {
        setOnlyBin(event.target.checked)
        let filter = getCurrentFilter()
        filter.onlyBin = event.target.checked
        onFilterChange(filter)
    }

    function onOnlyUnsoldChange(event: ChangeEvent<HTMLInputElement>) {
        let isActive = event.target.checked
        updateOnlyUnsold(isActive)
    }

    function onMinProfitChange(event: ChangeEvent<HTMLInputElement>) {
        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
        setMinProfit(val)
        let filter = getCurrentFilter()
        filter.minProfit = val
        onFilterChange(filter)
    }

    function onMinProfitPercentChange(event: ChangeEvent<HTMLInputElement>) {
        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
        setMinProfitPercent(val)
        let filter = getCurrentFilter()
        filter.minProfitPercent = val
        onFilterChange(filter)
    }

    function onMaxCostChange(event: ChangeEvent<HTMLInputElement>) {
        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
        setMaxCost(val)
        let filter = getCurrentFilter()
        filter.maxCost = val
        onFilterChange(filter)
    }

    function updateOnlyUnsold(isActive: boolean) {
        setOnlyUnsold(isActive)
        let filter = getCurrentFilter()
        filter.onlyUnsold = isActive
        onFilterChange(filter)
    }

    function onMinVolumeChange(event: ChangeEvent<HTMLInputElement>) {
        let val = AutoNumeric.getAutoNumericElement(event.target).getNumber() || 0
        setMinVolume(val)
        let filter = getCurrentFilter()
        filter.minVolume = val
        onFilterChange(filter)
    }

    function onRestrictionsChange(restrictions: FlipRestriction[]) {
        let filter = getCurrentFilter()
        filter.restrictions = restrictions
        setRestrictions(restrictions)
        onFilterChange(filter)
    }

    function onFreePremiumComplete() {
        setFreePremiumFilters(true)
    }

    function onFreeLoginComplete() {
        setFreeLoginFilters(true)
    }

    const countdownRenderer = ({ minutes, seconds }) => (
        <span>
            {zeroPad(minutes)}:{zeroPad(seconds)}
        </span>
    )

    let restrictionListDialog = (
        <Modal
            size={'xl'}
            show={showRestrictionList}
            onHide={() => {
                setShowRestrictionList(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Restrict the flip results</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FlipRestrictionList onRestrictionsChange={onRestrictionsChange} />
            </Modal.Body>
        </Modal>
    )

    const nonPremiumTooltip = (
        <span key="nonPremiumTooltip">
            This is a premium feature.
            <br />
            (to use for free wait <Countdown key={uuids[0]} date={FREE_PREMIUM_FILTER_TIME} renderer={countdownRenderer} />)
        </span>
    )
    const nonLoggedInTooltip = (
        <span key="nonLoggedInTooltip">
            Login to use these filters.
            <br />
            (or wait <Countdown key={uuids[1]} date={FREE_LOGIN_FILTER_TIME} renderer={countdownRenderer} />)
        </span>
    )

    const binFilter = (
        <Form.Group className={styles.filterCheckbox}>
            <Form.Label htmlFor="onlyBinCheckbox" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                Only BIN-Auctions
            </Form.Label>
            <Form.Check
                id="onlyBinCheckbox"
                onChange={onOnlyBinChange}
                defaultChecked={onlyBin}
                className={styles.flipperFilterFormfield}
                type="checkbox"
                disabled={!props.isPremium && !freePremiumFilters}
            />
        </Form.Group>
    )

    const soldFilter = (
        <Form.Group className={styles.filterCheckbox}>
            <Form.Label htmlFor="onlyUnsoldCheckbox" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                Hide SOLD Auctions
            </Form.Label>
            <Form.Check
                ref={onlyUnsoldRef}
                id="onlyUnsoldCheckbox"
                onChange={onOnlyUnsoldChange}
                defaultChecked={onlyUnsold}
                className={styles.flipperFilterFormfield}
                type="checkbox"
                disabled={!props.isPremium && !freePremiumFilters}
            />
        </Form.Group>
    )

    const openRestrictionListDialog = (
        <div
            onClick={() => {
                setShowRestrictionList(true)
            }}
            className={styles.filterCheckbox}
            style={{ cursor: 'pointer' }}
        >
            <span className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>Blacklist</span>
            <FilterIcon className={styles.flipperFilterFormfield} style={{ marginLeft: '-4px' }} />
        </div>
    )

    const numberFilters = (
        <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'flex-start' }}>
            <Form.Group className={styles.filterTextfield}>
                <Form.Label className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>Min. Profit:</Form.Label>
                <Form.Control
                    id="filter-input-min-profit"
                    key="filter-input-min-profit"
                    onChange={onMinProfitChange}
                    className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                    type="text"
                    disabled={!props.isLoggedIn && !freeLoginFilters}
                />
            </Form.Group>
            <Form.Group className={styles.filterTextfield}>
                <Form.Label className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>Min. Profit (%):</Form.Label>
                <Form.Control
                    id="filter-input-min-volume-percent"
                    key="filter-input-min-volume-percent"
                    onChange={onMinProfitPercentChange}
                    className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                    disabled={!props.isLoggedIn && !freeLoginFilters}
                />
            </Form.Group>
            <Form.Group className={styles.filterTextfield}>
                <Form.Label className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>Min. Volume:</Form.Label>
                <Form.Control
                    id="filter-input-min-volume"
                    key="filter-input-min-volume"
                    onChange={onMinVolumeChange}
                    className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                    disabled={!props.isLoggedIn && !freeLoginFilters}
                />
            </Form.Group>
            <Form.Group className={styles.filterTextfield}>
                <Form.Label className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>Max. Cost:</Form.Label>
                <Form.Control
                    id="filter-input-max-cost"
                    key="filter-input-max-cost"
                    onChange={onMaxCostChange}
                    className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                    disabled={!props.isLoggedIn && !freeLoginFilters}
                />
            </Form.Group>
        </div>
    )

    return (
        <div className={styles.flipperFilter}>
            <Form style={{ marginBottom: '5px' }}>
                {!props.isLoggedIn && !freeLoginFilters ? <Tooltip type="hover" content={numberFilters} tooltipContent={nonLoggedInTooltip} /> : numberFilters}
                <div className={styles.premiumFilters}>
                    {!props.isPremium && !freePremiumFilters ? <Tooltip type="hover" content={binFilter} tooltipContent={nonPremiumTooltip} /> : binFilter}

                    {!props.isPremium && !freePremiumFilters ? <Tooltip type="hover" content={soldFilter} tooltipContent={nonPremiumTooltip} /> : soldFilter}
                    {openRestrictionListDialog}
                </div>

                <div style={{ visibility: 'hidden', height: 0 }}>
                    <Countdown key={uuids[2]} onComplete={onFreePremiumComplete} date={FREE_PREMIUM_FILTER_TIME} />
                    <Countdown key={uuids[3]} onComplete={onFreeLoginComplete} date={FREE_LOGIN_FILTER_TIME} />
                </div>
            </Form>
            {restrictionListDialog}
        </div>
    )
}

export default React.memo(FlipperFilter)
