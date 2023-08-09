'use client'
import { ChangeEvent, useMemo, useState } from 'react'
import Slider from 'rc-slider'
import styles from './NumberRangeFilterElement.module.css'
import 'rc-slider/assets/index.css'
import { Form } from 'react-bootstrap'

interface Props {
    onChange(n: string)
    min?: number
    max?: number
    defaultValue: any
}

export function NumberRangeFilterElement(props: Props) {
    let defaultValue = useMemo(() => {
        return parseValue(props.defaultValue)
    }, [props.defaultValue])

    let [value, setValue] = useState(defaultValue)
    let [textValue, setTextValue] = useState(props.defaultValue)

    function parseValue(value: string | number | string[] | number[]): number[] {
        if (!value) {
            return [5, 5]
        }

        if (Array.isArray(value)) {
            return value.map(v => parseInt(v.toString()))
        }

        let checks = [
            {
                regexp: new RegExp(/^\d+-\d+$/),
                handler: value => value.split('-').map(v => parseInt(v))
            },
            {
                regexp: new RegExp(/^\d+$/),
                handler: value => [parseInt(value), parseInt(value)]
            },
            {
                regexp: new RegExp(/^<\d+$/),
                handler: value => [props.min || 0, parseInt(value.split('<')[1]) - 1]
            },
            {
                regexp: new RegExp(/^>\d+$/),
                handler: value => [parseInt(value.split('>')[1]) + 1, props.max]
            }
        ]

        let result
        checks.forEach(check => {
            if (value.toString().match(check.regexp)) {
                result = check.handler(value)
            }
        })
        return result
    }

    function _onTextChange(e: ChangeEvent<HTMLInputElement>) {
        setTextValue(e.target.value)
        if (!e.target.value) {
            return
        }
        let parsed = parseValue(e.target.value)
        if (!parsed) {
            return
        }
        setValue(parsed)
        props.onChange(`${parsed[0]}-${parsed[1]}`)
    }

    function _onRangeChange(values: number[]) {
        setTextValue(`${values[0]}-${values[1]}`)
        setValue(values)
        props.onChange(`${values[0]}-${values[1]}`)
    }

    function getMarks() {
        if (props.max === undefined || props.max === null) {
            return undefined
        }
        let marks = {}
        for (let i = props.min || 0; i <= props.max; i++) {
            marks[i] = i === 0 ? 'None' : i.toString()
        }
        return marks
    }

    return (
        <div className={styles.container}>
            <Form.Control value={textValue} onChange={_onTextChange} className={styles.textField} />
            <Slider
                className={styles.slider}
                range
                marks={getMarks()}
                allowCross={false}
                onChange={_onRangeChange}
                min={props.min || 0}
                max={props.max}
                value={value}
            />
        </div>
    )
}
