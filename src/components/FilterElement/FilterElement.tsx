/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import "react-datepicker/dist/react-datepicker.css";
import './FilterElement.css';
import { camelCaseToSentenceCase } from '../../utils/Formatter';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { FilterType, hasFlag } from './FilterType';
import { DateFilterElement } from './FilterElements/DateFilterElement';
import { RangeFilterElement } from './FilterElements/RangeFilterElement';
import { PlayerFilterElement } from './FilterElements/PlayerFilterElement';
import { SimpleEqualFilterElement } from './FilterElements/SimpleEqualFilterElement';
import { EqualFilterElement } from './FilterElements/EqualFilterElement';
import { PlayerWithRankFilterElement } from './FilterElements/PlayerWithRankFilterElement';

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

    function parseValue(newValue?: any) {
        if (props.options && hasFlag(props.options.type, FilterType.DATE)) {
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
        } else if (props.options && hasFlag(props.options.type, FilterType.NUMERICAL)) {
            if (!newValue) {
                return 1;
            }
            return newValue;
        } else {
            return newValue || "";
        }
    }

    function onFilterElementChange(value?: any) {
        if (!value) {
            setValue("");
            updateValue("");
        } else {
            setValue(value);
            updateValue(value.toString());
        }
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

    function validate(value?: any) {
        if (!value && value !== 0) {
            setErrorText("Please fill the filter or remove it")
            setIsValid(false);
            return false;
        }
        if (props.options && hasFlag(props.options.type, FilterType.NUMERICAL)) {
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

    function getFilterElement(type: FilterType, options: FilterOptions): JSX.Element {
        if (hasFlag(type, FilterType.DATE)) {
            return <DateFilterElement key={options.name} selected={value ? new Date(value * 1000) : new Date()} onChange={onFilterElementChange} />
        }
        if (hasFlag(type, FilterType.RANGE)) {
            return <RangeFilterElement isValid={isValid} key={options.name} defaultValue={props.defaultValue} onChange={onFilterElementChange} />
        }
        if (hasFlag(type, FilterType.PLAYER_WITH_RANK)) {
            return <PlayerWithRankFilterElement key={options.name} defaultValue={props.defaultValue} onChange={onFilterElementChange} />
        }
        if (hasFlag(type, FilterType.PLAYER)) {
            return <PlayerFilterElement key={options.name} defaultValue={props.defaultValue} returnType='uuid' onChange={onFilterElementChange} />
        }
        if (hasFlag(type, FilterType.EQUAL)) {
            if (hasFlag(options.type, FilterType.SIMPLE)) {
                return <SimpleEqualFilterElement key={options.name} options={options.options} defaultValue={props.defaultValue} isValid={isValid} onChange={onFilterElementChange} />
            } else {
                return <EqualFilterElement key={options.name} options={options} defaultValue={props.defaultValue} onChange={onFilterElementChange} />
            }
        }
        return <div />
    }

    return (
        <div className="generic-filter">
            {!props.options ? <Spinner animation="border" role="status" variant="primary" /> :
                <div style={{ display: "grid" }}>
                    <Form.Label style={{ float: "left" }}><b>{camelCaseToSentenceCase(props.options.name)}</b></Form.Label>
                    {
                        getFilterElement(props.options.type, props.options)
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


