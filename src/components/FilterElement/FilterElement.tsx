/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import "react-datepicker/dist/react-datepicker.css";
import './FilterElement.css';
import DatePicker from "react-datepicker";
import { camelCaseToSentenceCase, convertTagToName } from '../../utils/Formatter';

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
    defaultValue: any
}

function FilterElement(props: Props) {
    let [value, _setValue] = useState<any>();
    let [isValid, setIsValid] = useState(true);
    let [errorText, setErrorText] = useState("");

    useEffect(() => {
        if (value) {
            return;
        }
        let parsedDefaultValue = parseValue(props.defaultValue);
        updateValue(parsedDefaultValue);
        setValue(parsedDefaultValue);
    }, [])

    /**
     * Checks an FilterType if a flag is present
     * @param full the enum that should contain the flag
     * @param flag the flag to test against
     * @returns true if the enum contains the flag
     */
    function hasFlag(full?: FilterType, flag?: FilterTypeEnum) {
        return full && flag && (full & flag) === flag;
    }

    function parseValue(newValue?: any) {
        if (props.options && hasFlag(props.options.type, FilterTypeEnum.DATE)) {
            if (!newValue) {
                return new Date().getTime() / 1000;
            }
            if (!isNaN(newValue)) {
                return newValue;
            }
            let date = Date.parse(newValue) / 1000;
            if (!isNaN(date)) {
                return date;
            }
            return newValue;
        } else if (props.options && hasFlag(props.options.type, FilterTypeEnum.NUMERICAL)) {
            if (!newValue) {
                return 1;
            }
            return newValue;
        } else {
            return newValue || "";
        }
    }

    function updateSelectFilter(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex;
        let value = event.target.options[selectedIndex].getAttribute('data-id')!;
        setValue(value);
        updateValue(value);
    }

    function updateInputFilter(event: ChangeEvent<HTMLInputElement>) {
        setValue(event.target.value);
        updateValue(event.target.value);
    }

    function updateDateFilter(date: Date) {
        setValue(date.getTime() / 1000);
        updateValue(Math.round(date.getTime() / 1000).toString());
    }

    function updateValue(value: string) {

        if (!validate(value)) {
            return;
        }

        let newFilter = {};
        newFilter[props.options!.name] = value.toString();

        props.onFilterChange!(newFilter);
    }

    function setValue(value?: any) {
        _setValue(parseValue(value));
    }

    let selectOptions = props.options?.options.map(option => {
        return (<option data-id={option} key={option} value={option}>{convertTagToName(option)}</option>)
    })

    function validate(value?: any) {
        if (!value && value !== 0) {
            setErrorText("Please fill the filter or remove it")
            setIsValid(false);
            return false;
        }
        if (props.options && hasFlag(props.options.type, FilterTypeEnum.NUMERICAL)) {
            let v = parseInt(value);
            let lowEnd = parseInt(props.options.options[0]);
            let highEnd = parseInt(props.options.options[1]);
            if (v < lowEnd || v > highEnd) {
                setErrorText("Please choose a value between " + lowEnd + " and " + highEnd);
                setIsValid(false);
                return false;
            }
        }
        setIsValid(true);
        return true;
    }

    return (
        <div className="generic-filter">
            {!props.options ? <Spinner animation="border" role="status" variant="primary" /> :
                <div>
                    <Form.Label>{camelCaseToSentenceCase(props.options.name)}</Form.Label>
                    {
                        hasFlag(props.options.type, FilterTypeEnum.DATE)
                            ? <span><br /><DatePicker className="date-filter form-control" selected={value ? new Date(value * 1000) : new Date()} onChange={updateDateFilter} popperClassName="date-picker-popper" /></span>
                            : hasFlag(props.options.type, FilterTypeEnum.RANGE) ?
                                <Form.Control isInvalid={!isValid} key={props.options.name} className="select-filter" defaultValue={props.defaultValue} value={value} onChange={updateInputFilter}>

                                </Form.Control>
                                : <Form.Control isInvalid={!isValid} className="select-filter" defaultValue={props.defaultValue} value={value} as="select" onChange={updateSelectFilter}>
                                    {selectOptions}
                                </Form.Control>
                    }
                    {
                        !isValid ?
                            <div>
                                <Form.Control.Feedback type="invalid">
                                    <span style={{ color: "red" }}>{errorText}</span>
                                </Form.Control.Feedback>
                            </div> : ""
                    }
                </div>
            }

        </div >
    )
}

export default FilterElement;


