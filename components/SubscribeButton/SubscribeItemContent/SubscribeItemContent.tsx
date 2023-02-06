import { useEffect, useState } from 'react';
import { FormControl, InputGroup } from 'react-bootstrap';
import { Form } from 'react-bootstrap';
import api from '../../../api/ApiHelper';
import { Subscription, SubscriptionType } from '../../../api/ApiTypes.d';
import ItemFilter from '../../ItemFilter/ItemFilter';
import styles from './SubscribeItemContent.module.css';

interface Props {
  onPriceChange(value: string);
  onIsPriceAboveChange(value: boolean);
  onOnlyInstantBuyChange(value: boolean);
  onFilterChange(filter: ItemFilter);
  itemTag: string;
  prefill?: Subscription;
}

function SubscribeItemContent(props: Props) {
  let [filterOptions, setFilterOptions] = useState<FilterOptions[]>();

  useEffect(() => {
    api.getFilters(props.itemTag).then((options) => {
      setFilterOptions(options);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className='item-forms'>
        <InputGroup className='price-input'>
          <InputGroup.Prepend>
            <InputGroup.Text id='inputGroup-sizing-sm'>
              Item price
            </InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            aria-label='Small'
            aria-describedby='inputGroup-sizing-sm'
            type='number'
            defaultValue={props.prefill?.price}
            onChange={(e) => props.onPriceChange(e.target.value)}
          />
        </InputGroup>
        <hr />
        <h4 style={{ marginBottom: '20px' }}>Notify me...</h4>
        <Form.Group>
          <Form.Label htmlFor='priceAboveCheckbox'>
            if the price is above the selected value
          </Form.Label>
          <Form.Check
            type='radio'
            id='priceAboveCheckbox'
            name='priceState'
            defaultChecked={
              props.prefill &&
              (props.prefill.types as unknown as string[]).includes(
                SubscriptionType[SubscriptionType.PRICE_HIGHER_THAN]
              )
            }
            onChange={(e) => props.onIsPriceAboveChange(true)}
            className={styles.checkBox}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label htmlFor='priceBelowCheckbox'>
            if the price is below the selected value
          </Form.Label>
          <Form.Check
            type='radio'
            id='priceBelowCheckbox'
            name='priceState'
            defaultChecked={
              props.prefill &&
              (props.prefill.types as unknown as string[]).includes(
                SubscriptionType[SubscriptionType.PRICE_LOWER_THAN]
              )
            }
            onChange={(e) => props.onIsPriceAboveChange(false)}
            className={styles.checkBox}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label htmlFor='onlyIstantBuy'>only for instant buy</Form.Label>
          <Form.Check
            className={styles.checkBox}
            type='checkbox'
            defaultChecked={
              props.prefill &&
              (props.prefill.types as unknown as string[]).includes(
                SubscriptionType[SubscriptionType.BIN]
              )
            }
            id='onlyIstantBuy'
            onClick={(e) => {
              props.onOnlyInstantBuyChange(
                (e.target as HTMLInputElement).checked
              );
            }}
          />
        </Form.Group>
        <Form.Group>
          <ItemFilter
            defaultFilter={props.prefill?.filter}
            autoSelect={false}
            filters={filterOptions}
            forceOpen={true}
            ignoreURL={true}
            onFilterChange={props.onFilterChange}
          />
        </Form.Group>
      </div>
    </>
  );
}

export default SubscribeItemContent;
