import React, { ChangeEvent } from 'react'
import Slider from 'rc-slider'
import styles from './NumberRangeFilterElement.module.css'
import 'rc-slider/assets/index.css'

interface Props {
    onChange(n: string)
    min?: number
    max: number
    defaultValue: any
}

export function NumberRangeFilterElement(props: Props) {
    function _onChange(values: number[]) {
        props.onChange(`${values[0]}-${values[1]}`)
    }

    function getMarks(){
        let marks = {}
        for (let i = props.min; i <= props.max; i++) {
            marks[i] = i.toString()
        }
        return marks
    }

    return (
        <div>
            <Slider className={styles.slider} range marks={getMarks()} allowCross={false} onChange={_onChange} min={props.min || 0} max={props.max} />
        </div>
    )
}
