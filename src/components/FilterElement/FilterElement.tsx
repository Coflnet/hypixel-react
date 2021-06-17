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
    options?: FilterOptions[],
    filterName?: string,
    value?: any
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function FilterElement(props: Props) {
    let [date, setDate] = useState(new Date())
    let [value, setValue] = useState("");
    let options = props.options!.find(f => f.name == props.filterName)

    useEffect(() => {
        mounted = true;

        if (!options) {
            return;
        }

        if (props.options && hasFlag(options.type, FilterTypeEnum.DATE) && props.value) {
            setDate(new Date(parseInt(props.value) * 1000));
        } else {
            setValue(props.value);
        }
        return () => { mounted = false }
    }, []);

    /**
     * Checks an FilterType if a flag is present
     * @param full the enum that should contain the flag
     * @param flag the flag to test against
     * @returns true if the enum contains the flag
     */
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

    let selectOptions = options?.options.map(option => {
        return (<option data-id={option} key={option} value={option}>{option}</option>)
    })


    function updateValue(value: string) {
        let newFilter = {};
        newFilter[options!.name] = value;

        props.onFilterChange!(newFilter);
    }

    return (
        <div className="generic-filter">
            {!options ? <Spinner animation="border" role="status" variant="primary" /> :
                <div>
                    <Form.Label>{options.name}</Form.Label>
                    {
                        hasFlag(options.type, FilterTypeEnum.DATE)
                            ? <span><br/><DatePicker className="date-filter form-control" selected={date} onChange={updateDateFilter} popperClassName="date-picker-popper" /></span>
                            : hasFlag(options.type, FilterTypeEnum.RANGE) ?
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
}

export default FilterElement;


