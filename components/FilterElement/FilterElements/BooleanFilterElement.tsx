import { ChangeEvent } from 'react'
import { Form } from 'react-bootstrap'

interface Props {
    defaultValue: string
    onChange(n: boolean)
}

export function BooleanFilterElement(props: Props) {
    function _onChange(e: ChangeEvent<HTMLSelectElement>) {
        props.onChange((e.target as any).value)
    }

    return (
        <span>
            <Form.Select defaultValue={props.defaultValue || 'true'} onChange={_onChange}>
                <option key={'true'} value={'true'}>
                    true
                </option>
                <option key={'false'} value={'false'}>
                    false
                </option>
            </Form.Select>
        </span>
    )
}
