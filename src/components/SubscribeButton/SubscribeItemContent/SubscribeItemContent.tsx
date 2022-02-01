import React, { useEffect, useState } from 'react';
import { FormControl, InputGroup } from 'react-bootstrap';
import api from '../../../api/ApiHelper';
import ItemFilter from '../../ItemFilter/ItemFilter';

interface Props {
  onPriceChange(value: string);
  onIsPriceAboveChange(value: boolean);
  onOnlyInstantBuyChange(value: boolean);
  onFilterChange(filter: ItemFilter);
  itemTag: string;
}

function SubscribeItemContent(props: Props) {
  let [filterOptions, setFilterOptions] = useState<FilterOptions[]>();

  useEffect(() => {
    api.filterFor({ tag: props.itemTag }).then((options) => {
      setFilterOptions(options);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="item-forms">
        <InputGroup className="price-input">
          <InputGroup.Prepend>
            <InputGroup.Text id="inputGroup-sizing-sm">Item price</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl aria-label="Small" aria-describedby="inputGroup-sizing-sm" type="number" onChange={(e) => props.onPriceChange(e.target.value)} />
        </InputGroup>
        <h5>Notify me...</h5>
        <div className="input-data">
          <input type="radio" id="priceAboveCheckbox" defaultChecked name="priceState" onChange={(e) => props.onIsPriceAboveChange(true)} />
          <label htmlFor="priceAboveCheckbox">if the price is above the selected value</label>
        </div>
        <div className="input-data">
          <input type="radio" id="priceBelowCheckbox" name="priceState" onChange={(e) => props.onIsPriceAboveChange(false)} />
          <label htmlFor="priceBelowCheckbox">if the price is below the selected value</label>
        </div>
        <div className="input-data">
          <input
            type="checkbox"
            id="onlyIstantBuy"
            onClick={(e) => {
              props.onOnlyInstantBuyChange((e.target as HTMLInputElement).checked);
            }}
          />
          <label htmlFor="onlyIstantBuy">only for instant buy</label>
        </div>
        <div className="input-data">
          <ItemFilter filters={filterOptions} ignoreURL={true} isPrefill={false} onFilterChange={props.onFilterChange} />
        </div>
      </div>
    </>
  );
}

export default SubscribeItemContent;
