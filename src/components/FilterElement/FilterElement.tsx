/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { ChangeEvent, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import "react-datepicker/dist/react-datepicker.css";
import './FilterElement.css';
import DatePicker from "react-datepicker";
import { convertTagToName } from '../../utils/Formatter';

// has to be redefined because global types from react-app-env are not accessable
export enum FilterTypeEnum {
    Equal = 1,
    HIGHER = 2,
    LOWER = 4,
    DATE = 8,
    NUMERICAL = 16,
    RANGE = 32
}

interface Props {
    onFilterChange?(filter?: ItemFilter): void,
    options?: FilterOptions,
    defaultValue?: any
}

function FilterElement(props: Props) {
    let defaultValue = parseDefaultValue(props.defaultValue);
    let [value, setValue] = useState<any>();

    /**
     * Checks an FilterType if a flag is present
     * @param full the enum that should contain the flag
     * @param flag the flag to test against
     * @returns true if the enum contains the flag
     */
    function hasFlag(full?: FilterType, flag?: FilterTypeEnum) {
        return full && flag && (full & flag) === flag;
    }

    function parseDefaultValue(value: any) {
        if (props.options && hasFlag(props.options.type, FilterTypeEnum.DATE) && value) {
            setValue(new Date(parseInt(value) * 1000));
        } else {
            return value;
        }
    }

    function updateSelectFilter (event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex;
        let value = event.target.options[selectedIndex].getAttribute('data-id')!;
        setValue(value);
        updateValue(value);
    }

    function updateInputFilter (event: ChangeEvent<HTMLInputElement>) {
        setValue(event.target.value);
        updateValue(event.target.value);
    }

    function updateDateFilter (date: Date) {
        setValue(date);
        updateValue((date.getTime() / 1000).toString());
    }
    
    function updateValue(value: string) {
        let newFilter = {};
        newFilter[props.options!.name] = value;

        props.onFilterChange!(newFilter);
    }

    let selectOptions = props.options?.options.map(option => {
        return (<option data-id={option} key={option} value={option}>{convertTagToName(option)}</option>)
    })

    return (
        <div className="generic-filter">
            {!props.options ? <Spinner animation="border" role="status" variant="primary" /> :
                <div>
                    <Form.Label>{props.options.name}</Form.Label>
                    {
                        hasFlag(props.options.type, FilterTypeEnum.DATE)
                            ? <span><br /><DatePicker className="date-filter form-control" selected={defaultValue} onChange={updateDateFilter} popperClassName="date-picker-popper" /></span>
                            : hasFlag(props.options.type, FilterTypeEnum.RANGE) ?
                                <Form.Control key={"eins"} className="select-filter" defaultValue={defaultValue} value={value} onChange={updateInputFilter}>

                                </Form.Control>
                                : <Form.Control className="select-filter" defaultValue={defaultValue} value={value} as="select" onChange={updateSelectFilter}>
                                    {selectOptions}
                                </Form.Control>
                    }
                </div>
            }

        </div >
    )
}

export default FilterElement;


