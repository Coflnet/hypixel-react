'use client'
import React from 'react'
import DatePicker from 'react-datepicker'
import styles from './DateFilterElement.module.css'

interface Props {
    selected: Date
    onChange(n: number)
}

export function DateFilterElement(props: Props) {
    function _onChange(date: Date) {
        date = date || new Date()
        props.onChange(Math.round(date.getTime() / 1000))
    }

    return (
        <span>
            <DatePicker
                showIcon
                calendarIconClassName={styles.calendarIcon}
                showTimeSelect
                className={`date-filter form-control ${styles.dateFilter}`}
                selected={props.selected}
                dateFormat={'yyyy/MM/dd HH:mm'}
                onChange={_onChange}
                popperClassName={styles.datePickerPopper}
            />
        </span>
    )
}
