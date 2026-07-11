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
    prefill?: NotificationListener
    prefillPrice?: string
    onIsFilterValidChange?(newIsFilter: boolean)
}

function SubscribeItemContent(props: Props) {
    let [filterOptions, setFilterOptions] = useState<FilterOptions[]>()
    let prefillIsAbove = props.prefill
        ? (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.PRICE_HIGHER_THAN])
        : false
    let prefillHasFilter = props.prefill?.filter && Object.keys(props.prefill.filter).length > 0
    let prefillIsBin = props.prefill ? (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.BIN]) : false
    let [isAbove, setIsAbove] = useState(prefillIsAbove)
    let [showMore, setShowMore] = useState(!!prefillHasFilter || prefillIsBin)
    let [priceDisplay, setPriceDisplay] = useState(formatThousandsSpaced(props.prefill?.price?.toString() ?? props.prefillPrice ?? ''))

    useEffect(() => {
        api.getFilters(props.itemTag).then(options => {
            setFilterOptions(options)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <div className="item-forms">
                <ToggleButtonGroup
                    type="radio"
                    name="priceDirection"
                    className={styles.priceDirection}
                    value={isAbove ? 'above' : 'below'}
                    onChange={val => {
                        let above = val === 'above'
                        setIsAbove(above)
                        props.onIsPriceAboveChange(above)
                    }}
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
                        value={priceDisplay}
                        onChange={e => {
                            let raw = parseFormattedNumber(e.target.value)
                            setPriceDisplay(formatThousandsSpaced(raw))
                            props.onPriceChange(raw)
                        }}
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
                            <ItemFilter
                                defaultFilter={props.prefill?.filter}
                                autoSelect={false}
                                filters={filterOptions}
                                forceOpen={!!prefillHasFilter}
                                ignoreURL={true}
                                onFilterChange={props.onFilterChange}
                                onIsValidChange={props.onIsFilterValidChange}
                            />
                        </Form.Group>
                    </div>
                )}
            </div>
        </>
    )
}

export default SubscribeItemContent
