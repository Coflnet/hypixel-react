import { ChangeEvent } from 'react'
import { Form } from 'react-bootstrap'
import { convertTagToName } from '../../../utils/Formatter'

interface Props {
    onChange(n: string)
    options: string[]
    defaultValue: any
    isValid: boolean
}

export function SimpleEqualFilterElement(props: Props) {
    function _onChange(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('data-id')!
        props.onChange(value)
    }

    function getSelectOptions() {
        return props.options.map(option => (
            <option data-id={option} key={option} value={option}>
                {convertTagToName(option)}
            </option>
        ))
    }

    return (
        <Form.Control isInvalid={!props.isValid} defaultValue={props.defaultValue} as="select" onChange={_onChange}>
            {getSelectOptions()}
        </Form.Control>
    )
}
