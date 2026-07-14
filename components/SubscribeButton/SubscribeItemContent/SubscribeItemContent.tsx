'use client'
import { useEffect, useState } from 'react'
import { FormControl, InputGroup, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { Form } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { NotificationListener, SubscriptionType } from '../../../api/ApiTypes.d'
import ItemFilter from '../../ItemFilter/ItemFilter'
import { formatThousandsSpaced, parseFormattedNumber } from '../../../utils/Formatter'
import styles from './SubscribeItemContent.module.css'

interface Props {
    onPriceChange(value: string)
    onIsPriceAboveChange(value: boolean)
    onOnlyInstantBuyChange(value: boolean)
    onFilterChange(filter: ItemFilter)
    itemTag: string
    isPriceAbove: boolean
    priceValue?: string
    prefill?: NotificationListener
    /** filter the user is currently searching with; copied into the notifier unless they clear it */
    defaultFilter?: ItemFilter
    onIsFilterValidChange?(newIsFilter: boolean)
}

function hasFilters(filter?: ItemFilter): boolean {
    return !!filter && Object.keys(filter).length > 0
}

function SubscribeItemContent(props: Props) {
    let [filterOptions, setFilterOptions] = useState<FilterOptions[]>()
    let prefillIsBin = props.prefill ? (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.BIN]) : false
    let initialFilter = props.prefill?.filter || props.defaultFilter
    // the filter the ItemFilter is (re-)initialized with; cleared (and remounted) by "Clear filters"
    let [startFilter, setStartFilter] = useState<ItemFilter | undefined>(hasFilters(initialFilter) ? initialFilter : undefined)
    let [filterKey, setFilterKey] = useState(0)
    let [currentFilterCount, setCurrentFilterCount] = useState(Object.keys(initialFilter || {}).length)
    let [showMore, setShowMore] = useState(hasFilters(initialFilter) || prefillIsBin)

    useEffect(() => {
        api.getFilters(props.itemTag).then(options => {
            setFilterOptions(options)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function onFilterChange(filter: ItemFilter) {
        setCurrentFilterCount(Object.keys(filter || {}).length)
        props.onFilterChange(filter)
    }

    function clearFilters() {
        setStartFilter(undefined)
        setFilterKey(filterKey + 1) // remount the ItemFilter so it drops its internal state
        setCurrentFilterCount(0)
        props.onFilterChange({})
    }

    return (
        <div className="item-forms">
            <ToggleButtonGroup
                type="radio"
                name="priceDirection"
                className={styles.priceDirection}
                value={props.isPriceAbove ? 'above' : 'below'}
                onChange={val => props.onIsPriceAboveChange(val === 'above')}
            >
                <ToggleButton id="priceBelowButton" value="below" variant="outline-primary" size="sm">
                    Price drops below
                </ToggleButton>
                <ToggleButton id="priceAboveButton" value="above" variant="outline-primary" size="sm">
                    Price rises above
                </ToggleButton>
            </ToggleButtonGroup>
            <InputGroup className={styles.priceInput}>
                <InputGroup.Text id="inputGroup-sizing-sm">Price</InputGroup.Text>
                <FormControl
                    aria-label="Price"
                    aria-describedby="inputGroup-sizing-sm"
                    type="text"
                    inputMode="numeric"
                    value={formatThousandsSpaced(props.priceValue ?? '')}
                    onChange={e => props.onPriceChange(parseFormattedNumber(e.target.value))}
                />
                <InputGroup.Text>coins</InputGroup.Text>
            </InputGroup>
            {!showMore ? (
                <a
                    href="#"
                    className={styles.moreLink}
                    onClick={e => {
                        e.preventDefault()
                        setShowMore(true)
                    }}
                >
                    + More options (instant-buy only, item filter)
                </a>
            ) : (
                <div className={styles.moreOptions}>
                    <Form.Group>
                        <Form.Check
                            className={styles.checkBox}
                            type="checkbox"
                            defaultChecked={prefillIsBin}
                            id="onlyIstantBuy"
                            label="Only notify for instant buy (BIN)"
                            onClick={e => {
                                props.onOnlyInstantBuyChange((e.target as HTMLInputElement).checked)
                            }}
                        />
                    </Form.Group>
                    <Form.Group>
                        {currentFilterCount > 0 ? (
                            <div className={styles.filterHeader}>
                                <span className={styles.filterHint}>Using the filters you searched with</span>
                                <a
                                    href="#"
                                    onClick={e => {
                                        e.preventDefault()
                                        clearFilters()
                                    }}
                                >
                                    Clear filters
                                </a>
                            </div>
                        ) : null}
                        <ItemFilter
                            key={filterKey}
                            defaultFilter={startFilter}
                            autoSelect={false}
                            filters={filterOptions}
                            forceOpen={hasFilters(startFilter)}
                            ignoreURL={true}
                            disableLastUsedFilter={true}
                            onFilterChange={onFilterChange}
                            onIsValidChange={props.onIsFilterValidChange}
                        />
                    </Form.Group>
                </div>
            )}
        </div>
    )
}

export default SubscribeItemContent
