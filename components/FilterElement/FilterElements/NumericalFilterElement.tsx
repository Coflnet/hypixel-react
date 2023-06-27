'use client'
import { Form } from 'react-bootstrap'
import { NumberFormatValues, NumericFormat } from 'react-number-format'
import { getDecimalSeparator, getThousandSeparator } from '../../../utils/Formatter'

interface Props {
    onChange(n: string)
    options: FilterOptions
    defaultValue: any
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
            thousandSeparator={getThousandSeparator()}
            decimalSeparator={getDecimalSeparator()}
            allowNegative={false}
            isAllowed={value => {
                if (!value.floatValue) {
                    return true
                }
                let options = props.options?.options
                if (options.length === 2 && !isNaN(+options[0]) && !isNaN(+options[1])) {
                    return value.floatValue > +options[0] && value.floatValue < +options[1]
                }
                return true
            }}
            decimalScale={0}
        />
    )
}
