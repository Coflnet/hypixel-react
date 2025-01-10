'use client'
import { FormControl, InputGroup } from 'react-bootstrap'
import { Form } from 'react-bootstrap'
import { NotificationListener, SubscriptionType } from '../../../api/ApiTypes.d'
import styles from './SubscribeBazaarItemContent.module.css'

interface Props {
    onPriceChange(value: string)
    onIsPriceAboveChange(value: boolean)
    onUseSellPriceChange(value: boolean)
    itemTag: string
    prefill?: NotificationListener
}

function SubscribeBazaarItemContent(props: Props) {
    return (
        <>
            <div className="item-forms">
                <InputGroup className="price-input">
                    <InputGroup.Text id="inputGroup-sizing-sm">Item price</InputGroup.Text>
                    <FormControl
                        aria-label="Small"
                        aria-describedby="inputGroup-sizing-sm"
                        type="number"
                        defaultValue={props.prefill?.price}
                        onChange={e => props.onPriceChange(e.target.value)}
                    />
                </InputGroup>
                <hr />
                <h4 style={{ marginBottom: '20px' }}>Notify me...</h4>
                <Form.Group>
                    <Form.Label htmlFor="priceAboveCheckbox">if the price is above the selected value</Form.Label>
                    <Form.Check
                        type="radio"
                        id="priceAboveCheckbox"
                        name="priceState"
                        defaultChecked={
                            props.prefill && (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.PRICE_HIGHER_THAN])
                        }
                        onChange={e => props.onIsPriceAboveChange(true)}
                        className={styles.checkBox}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label htmlFor="priceBelowCheckbox">if the price is below the selected value</Form.Label>
                    <Form.Check
                        type="radio"
                        id="priceBelowCheckbox"
                        name="priceState"
                        defaultChecked={
                            props.prefill && (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.PRICE_LOWER_THAN])
                        }
                        onChange={e => props.onIsPriceAboveChange(false)}
                        className={styles.checkBox}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label htmlFor="useSellPriceCheckbox">if the sell price should be used</Form.Label>
                    <Form.Check
                        type="checkbox"
                        id="useSellPriceCheckbox"
                        defaultChecked={
                            props.prefill && (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.USE_SELL_NOT_BUY])
                        }
                        onChange={e => props.onUseSellPriceChange(e.target.checked)}
                        className={styles.checkBox}
                    />
                </Form.Group>
            </div>
        </>
    )
}

export default SubscribeBazaarItemContent
