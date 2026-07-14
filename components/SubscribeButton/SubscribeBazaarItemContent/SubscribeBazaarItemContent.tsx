'use client'
import { FormControl, InputGroup, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { formatThousandsSpaced, parseFormattedNumber } from '../../../utils/Formatter'
import styles from './SubscribeBazaarItemContent.module.css'

interface Props {
    onPriceChange(value: string)
    onIsPriceAboveChange(value: boolean)
    onUseSellPriceChange(value: boolean)
    itemTag: string
    isPriceAbove: boolean
    useSellPrice: boolean
    priceValue?: string
}

function SubscribeBazaarItemContent(props: Props) {
    return (
        <div className="item-forms">
            <ToggleButtonGroup
                type="radio"
                name="bazaarPriceDirection"
                className={styles.priceDirection}
                value={props.isPriceAbove ? 'above' : 'below'}
                onChange={val => props.onIsPriceAboveChange(val === 'above')}
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
            <span className={styles.compareLabel}>Which price to watch</span>
            <ToggleButtonGroup
                type="radio"
                name="bazaarPriceSource"
                className={styles.priceDirection}
                value={props.useSellPrice ? 'sell' : 'buy'}
                onChange={val => props.onUseSellPriceChange(val === 'sell')}
            >
                <ToggleButton id="bazaarBuyPriceButton" value="buy" variant="outline-primary" size="sm">
                    Buy price
                </ToggleButton>
                <ToggleButton id="bazaarSellPriceButton" value="sell" variant="outline-primary" size="sm">
                    Sell price
                </ToggleButton>
            </ToggleButtonGroup>
            <span className={styles.compareHint}>
                {props.useSellPrice
                    ? 'Sell price: what you get for instantly selling this item'
                    : 'Buy price: what you pay for instantly buying this item'}
            </span>
        </div>
    )
}

export default SubscribeBazaarItemContent
