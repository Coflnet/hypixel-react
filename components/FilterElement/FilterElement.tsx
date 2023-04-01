/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { useEffect, useState } from 'react'
import { Form, Spinner } from 'react-bootstrap'
import { camelCaseToSentenceCase } from '../../utils/Formatter'
import { FilterType, hasFlag } from './FilterType'
import { DateFilterElement } from './FilterElements/DateFilterElement'
import { RangeFilterElement } from './FilterElements/RangeFilterElement'
import { PlayerFilterElement } from './FilterElements/PlayerFilterElement'
import { SimpleEqualFilterElement } from './FilterElements/SimpleEqualFilterElement'
import { EqualFilterElement } from './FilterElements/EqualFilterElement'
import { PlayerWithRankFilterElement } from './FilterElements/PlayerWithRankFilterElement'
import { ColorFilterElement } from './FilterElements/ColorFilterElement'
import { BooleanFilterElement } from './FilterElements/BooleanFilterElement'
import styles from './FilterElement.module.css'
import { NumericalFilterElement } from './FilterElements/NumericalFilterElement'
import { NumberRangeFilterElement } from './FilterElements/NumberRangeFilterElement'

interface Props {
    onFilterChange?(filter?: ItemFilter): void
    options?: FilterOptions
    defaultValue: any
}

function FilterElement(props: Props) {
    let [value, _setValue] = useState<any>()
    let [isValid, setIsValid] = useState(true)
    let [errorText, setErrorText] = useState('')

    useEffect(() => {
        if (value) {
            return
        }
        let parsedDefaultValue = parseValue(props.defaultValue)
        updateValue(parsedDefaultValue)
        setValue(parsedDefaultValue)
    }, [])

    function parseValue(newValue?: any) {
        if (props.options && hasFlag(props.options.type, FilterType.DATE)) {
            if (!newValue) {
                return new Date().getTime() / 1000
            }
            if (!isNaN(newValue)) {
                return newValue
            }
            let date = Date.parse(newValue) / 1000
            if (!isNaN(date)) {
                return date
            }
            return newValue
        } else if (props.options && hasFlag(props.options.type, FilterType.NUMERICAL)) {
            if (!newValue) {
                return 1
            }
            return newValue
        } else {
            return newValue || ''
        }
    }

    function onFilterElementChange(value?: any) {
        if (!value) {
            setValue('')
            updateValue('')
        } else {
            setValue(value)
            updateValue(value.toString())
        }
    }

    function updateValue(value: string) {
        if (!validate(value)) {
            return
        }

        let newFilter = {}
        newFilter[props.options!.name] = value.toString()

        props.onFilterChange!(newFilter)
    }

    function setValue(value?: any) {
        _setValue(parseValue(value))
    }

    function validate(value?: any) {
        if (!value && value !== 0) {
            setErrorText('Please fill the filter or remove it')
            setIsValid(false)
            return false
        }
        if (props.options && hasFlag(props.options.type, FilterType.NUMERICAL)) {
            // TODO: Validation for custom number formats (like 2m or 1m-2m)
            let v = parseInt(value)
            let lowEnd = parseInt(props.options.options[0])
            let highEnd = parseInt(props.options.options[1])
            if (v < lowEnd || v > highEnd) {
                setErrorText('Please choose a value between ' + lowEnd + ' and ' + highEnd)
                setIsValid(false)
                return false
            }
        }
        setIsValid(true)
        return true
    }

    function getFilterElement(type: FilterType, options: FilterOptions): JSX.Element {
        // Special case for the color filter, as there is no FilterType on the backend for that
        if (options.name === 'Color') {
            return <ColorFilterElement key={options.name} defaultValue={props.defaultValue} onChange={onFilterElementChange} />
        }
        if (
            options.options.length === 2 &&
            !isNaN(parseInt(options.options[0])) &&
            !isNaN(parseInt(options.options[1])) &&
            parseInt(options.options[1]) <= 10
        ) {
            return (
                <NumberRangeFilterElement
                    key={options.name}
                    defaultValue={props.defaultValue}
                    min={parseInt(props.options.options[0])}
                    max={parseInt(props.options.options[1])}
                    onChange={onFilterElementChange}
                />
            )
        }
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
            return <PlayerFilterElement key={options.name} defaultValue={props.defaultValue} returnType="uuid" onChange={onFilterElementChange} />
        }
        if (hasFlag(type, FilterType.BOOLEAN)) {
            return <BooleanFilterElement key={options.name} defaultValue={props.defaultValue} onChange={onFilterElementChange} />
        }
        if (hasFlag(type, FilterType.EQUAL)) {
            if (hasFlag(options.type, FilterType.SIMPLE)) {
                return (
                    <SimpleEqualFilterElement
                        key={options.name}
                        options={options.options}
                        defaultValue={props.defaultValue}
                        isValid={isValid}
                        onChange={onFilterElementChange}
                    />
                )
            } else {
                return <EqualFilterElement key={options.name} options={options} defaultValue={props.defaultValue} onChange={onFilterElementChange} />
            }
        }
        if (hasFlag(type, FilterType.NUMERICAL)) {
            return <NumericalFilterElement key={options.name} defaultValue={props.defaultValue} options={options} onChange={onFilterElementChange} />
        }
        return <div />
    }

    return (
        <div className={styles.genericFilter}>
            {!props.options ? (
                <Spinner animation="border" role="status" variant="primary" />
            ) : (
                <div style={{ display: 'grid' }}>
                    <Form.Label style={{ float: 'left' }}>
                        <b>{camelCaseToSentenceCase(props.options.name)}</b>
                    </Form.Label>
                    {getFilterElement(props.options.type, props.options)}
                    {!isValid ? (
                        <div>
                            <Form.Control.Feedback type="invalid">
                                <span style={{ color: 'red' }}>{errorText}</span>
                            </Form.Control.Feedback>
                        </div>
                    ) : (
                        ''
                    )}
                </div>
            )}
        </div>
    )
}

export default FilterElement
