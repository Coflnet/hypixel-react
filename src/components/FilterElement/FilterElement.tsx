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
    NUMERICAL = 16
}

interface Props {
    onFilterChange?(filter?: ItemFilter): void,
    filterName?: string
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function FilterElement(props: Props) {

    const reforgeSelect = useRef(null);

    let [filterOptions, setFilterOptions] = useState<FilterOptions>();

    let [date, setDate] = useState(new Date())

    useEffect(() => {
        mounted = true;
        loadFilterOptions();
        return () => { mounted = false }
    }, []);



    let loadFilterOptions = () => {
        api.getFilter(props.filterName!).then(options => {
            console.log(options);
            if (!mounted) {
                return;
            }
            setFilterOptions(options);
        })
    }

    let updateFilter = (event: ChangeEvent<HTMLSelectElement>) => {
        let selectedIndex = event.target.options.selectedIndex;
        let value = event.target.options[selectedIndex].getAttribute('data-id')!;
        let newFilter = {};
        newFilter[props.filterName!] = value;
        props.onFilterChange!(newFilter)
    }

    let selectOptions = filterOptions?.options.map(option => {
        return (<option data-id={option} key={option} value={option}>{option}</option>)
    })

    let hasFlag = (full?: FilterType, flag?: FilterTypeEnum) => {
        console.log(full);
        return full && flag && (full & flag) === flag;
    }


    return (
        <div className="generic-filter">
            {!filterOptions ? <Spinner animation="border" role="status" variant="primary" /> :
                <div>
                    <Form.Label>{filterOptions.name}</Form.Label>
                    {
                        hasFlag(filterOptions.type, FilterTypeEnum.DATE)
                            ? <DatePicker selected={date} onChange={(date) => setDate(date)} popperClassName="date-picker-popper" />
                            : <Form.Control className="select-filter" as="select" onChange={updateFilter} ref={reforgeSelect}>
                                {selectOptions}
                            </Form.Control>
                    }
                </div>
            }

        </div >
    )
}

export default FilterElement;


