'use client'
import { useState } from 'react'
import { FormControl, InputGroup, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { Form } from 'react-bootstrap'
import { NotificationListener, SubscriptionType } from '../../../api/ApiTypes.d'
import { formatThousandsSpaced, parseFormattedNumber } from '../../../utils/Formatter'
import styles from './SubscribeBazaarItemContent.module.css'

interface Props {
    onPriceChange(value: string)
    onIsPriceAboveChange(value: boolean)
    onUseSellPriceChange(value: boolean)
    itemTag: string
    prefill?: NotificationListener
    priceValue?: string
}

function SubscribeBazaarItemContent(props: Props) {
    let prefillIsAbove = props.prefill
        ? (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.PRICE_HIGHER_THAN])
        : false
    let prefillUseSell = props.prefill
        ? (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.USE_SELL_NOT_BUY])
        : false
    let [isAbove, setIsAbove] = useState(prefillIsAbove)
    let [useSell, setUseSell] = useState(prefillUseSell)

    return (
        <>
            <div className="item-forms">
                <ToggleButtonGroup
                    type="radio"
                    name="bazaarPriceDirection"
                    className={styles.priceDirection}
                    value={isAbove ? 'above' : 'below'}
                    onChange={val => {
                        let above = val === 'above'
                        setIsAbove(above)
                        props.onIsPriceAboveChange(above)
                    }}
                >
                    <ToggleButton id="bazaarPriceBelowButton" value="below" variant="outline-primary" size="sm">
                        Price drops below
                    </ToggleButton>
                    <ToggleButton id="bazaarPriceAboveButton" value="above" variant="outline-primary" size="sm">
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
                <Form.Check
                    type="switch"
                    id="useSellPriceCheckbox"
                    checked={useSell}
                    label={useSell ? 'Comparing against sell price' : 'Comparing against buy price'}
                    onChange={e => {
                        setUseSell(e.target.checked)
                        props.onUseSellPriceChange(e.target.checked)
                    }}
                />
            </div>
        </>
    )
}

export default SubscribeBazaarItemContent
