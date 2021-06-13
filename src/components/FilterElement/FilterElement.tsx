/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import "react-datepicker/dist/react-datepicker.css";
import './FilterElement.css';
import api from '../../api/ApiHelper';
import DatePicker from "react-datepicker";

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
    value?: any
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function FilterElement(props: Props) {
    let [date, setDate] = useState(new Date())
    let [value, setValue] = useState<string>();

    useEffect(() => {
        mounted = true;
        console.log(props.options)
        if (props.options && hasFlag(props.options!.type, FilterTypeEnum.DATE) && props.value)
            setDate(new Date(parseInt(props.value) * 1000));
        else
            setValue(props.value);
        return () => { mounted = false }
    }, []);

    let hasFlag = (full?: FilterType, flag?: FilterTypeEnum) => {
        return full && flag && (full & flag) === flag;
    }




    let updateSelectFilter = (event: ChangeEvent<HTMLSelectElement>) => {
        let selectedIndex = event.target.options.selectedIndex;
        let value = event.target.options[selectedIndex].getAttribute('data-id')!;
        setValue(value);
        updateValue(value);
    }

    let updateInputFilter = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        updateValue(event.target.value);
    }




    let updateDateFilter = (date: Date) => {
        setDate(date);
        updateValue((date.getTime() / 1000).toString());
    }

    let selectOptions = props.options?.options.map(option => {
        return (<option data-id={option} key={option} value={option}>{option}</option>)
    })




    return (
        <div className="generic-filter">
            {!props.options ? <Spinner animation="border" role="status" variant="primary" /> :
                <div>
                    <Form.Label>{props.options.name}</Form.Label>
                    {
                        hasFlag(props.options.type, FilterTypeEnum.DATE)
                            ? <DatePicker selected={date} onChange={updateDateFilter} popperClassName="date-picker-popper" />
                            : hasFlag(props.options.type, FilterTypeEnum.RANGE) ?
                                <Form.Control key={"eins"} className="select-filter" value={value} onChange={updateInputFilter}>

                                </Form.Control>
                                : <Form.Control className="select-filter" value={value} as="select" onChange={updateSelectFilter}>
                                    {selectOptions}
                                </Form.Control>
                    }
                </div>
            }

        </div >
    )

    function updateValue(value: string) {
        let newFilter = {};
        newFilter[props.options!.name] = value;
        console.log(newFilter);
        props.onFilterChange!(newFilter);
    }
}

export default FilterElement;


