'use client'
import { Form } from 'react-bootstrap'
import { NumberFormatValues, NumericFormat } from 'react-number-format'

interface Props {
    onChange(n: string)
    options: FilterOptions
    defaultValue: string | number
}

export function NumericalFilterElement(props: Props) {
    function _onChange(values: NumberFormatValues) {
        props.onChange(values.value || '')
    }

    return (
        <NumericFormat
            onValueChange={_onChange}
            customInput={Form.Control}
            defaultValue={props.defaultValue}
            allowNegative={false}
            isAllowed={value => {
                if (!value.floatValue) {
                    return true
                }
                const options = props.options?.options
                if (options.length === 2 && !isNaN(+options[0]) && !isNaN(+options[1])) {
                    return value.floatValue >= +options[0] && value.floatValue <= +options[1]
                }
                return true
            }}
            decimalScale={2}
        />
    )
}
