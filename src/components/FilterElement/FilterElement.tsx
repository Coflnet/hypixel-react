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
    filterName?: string,
    value?: any
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function FilterElement(props: Props) {

    const reforgeSelect = useRef(null);

    let [filterOptions, setFilterOptions] = useState<FilterOptions>();

    let [date, setDate] = useState(new Date())
    let [value,setValue] = useState<string>();

    useEffect(() => {
        mounted = true;
        loadFilterOptions();
        return () => { mounted = false }
    }, []);

    let hasFlag = (full?: FilterType, flag?: FilterTypeEnum) => {
        return full && flag && (full & flag) === flag;
    }

    let loadFilterOptions = () => {
        api.getFilter(props.filterName!).then(options => {
            console.log(props);
            console.log(options)
            if (!mounted) {
                return;
            }
            if(hasFlag(options.type,FilterTypeEnum.DATE) && props.value )
                setDate(new Date(parseInt(props.value)*1000));
            else
                setValue(props.value);
            setFilterOptions(options);
        })
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

    
    

    let updateDateFilter = (date : Date ) => {
        setDate(date);
        updateValue((date.getTime()/1000).toString());
    }

    let selectOptions = filterOptions?.options.map(option => {
        return (<option data-id={option} key={option} value={option}>{option}</option>)
    })




    return (
        <div className="generic-filter">
            {!filterOptions ? <Spinner animation="border" role="status" variant="primary" /> :
                <div>
                    <Form.Label>{filterOptions.name}</Form.Label>
                    {
                        hasFlag(filterOptions.type, FilterTypeEnum.DATE)
                            ? <DatePicker selected={date} onChange={updateDateFilter}  popperClassName="date-picker-popper" />
                            : hasFlag(filterOptions.type, FilterTypeEnum.RANGE) ? 
                            <Form.Control className="select-filter" value={value} onChange={updateInputFilter} ref={reforgeSelect}>
                                
                            </Form.Control>
                            :<Form.Control className="select-filter" value={value} as="select" onChange={updateSelectFilter} ref={reforgeSelect}>
                                {selectOptions}
                            </Form.Control>
                    }
                </div>
            }

        </div >
    )

    function updateValue(value: string) {
        let newFilter = {};
        newFilter[props.filterName!] = value;
        console.log(newFilter);
        props.onFilterChange!(newFilter);
    }
}

export default FilterElement;


