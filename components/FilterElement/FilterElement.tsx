'use client'
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { useEffect, useState } from 'react'
import { Form, Spinner } from 'react-bootstrap'
import { camelCaseToSentenceCase, convertTagToName } from '../../utils/Formatter'
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
import { validateFilterNumber, validateFilterRange } from '../../utils/NumberValidationUtils'
import Tooltip from '../Tooltip/Tooltip'
import HelpIcon from '@mui/icons-material/Help'

interface Props {
    onFilterChange?(filter?: ItemFilter): void
    options?: FilterOptions
    defaultValue: any
    onIsValidChange?(newIsValid: boolean)
}

function FilterElement(props: Props) {
    let [value, _setValue] = useState<any>()
    let [isValid, _setIsValid] = useState(true)
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
                return Math.round(new Date().getTime() / 1000)
            }
            if (!isNaN(newValue)) {
                return newValue
            }
            let date = Math.round(Date.parse(newValue) / 1000)
            if (!isNaN(date)) {
                return date
            }
            return newValue
        } else {
            if (!newValue && newValue !== 0) {
                return ''
            }
            return newValue
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

    function setIsValid(newValue: boolean) {
        if (props.onIsValidChange) {
            props.onIsValidChange(newValue)
        }
        _setIsValid(newValue)
    }

    function validate(value?: any) {
        if (!value && value !== 0) {
            setErrorText('Please fill the filter or remove it')
            setIsValid(false)
            return false
        }
        if (props.options && hasFlag(props.options.type, FilterType.NUMERICAL) && hasFlag(props.options.type, FilterType.RANGE)) {
            let validationResult = validateFilterRange(value.toString(), props.options)
            setIsValid(validationResult[0])
            if (!validationResult[0]) {
                setErrorText(validationResult[1] || '')
                return false
            }
            return true
        }
        if (props.options && hasFlag(props.options.type, FilterType.DATE)) {
            let date = new Date(value * 1000)
            if (date < new Date(props.options.options[0])) {
                setErrorText(`Date needs to be after ${props.options.options[0]}`)
                setIsValid(false)
                return false
            }
            if (date > new Date(props.options.options[1])) {
                setErrorText(`Date needs to be before ${props.options.options[1]}`)
                setIsValid(false)
                return false
            }
            setIsValid(true)
            return true
        }
        if (props.options && hasFlag(props.options.type, FilterType.RANGE)) {
            if (props.options?.options.length === 2 && props.options.options[0] === '000000000000' && props.options.options[1] === 'ffffffffffff') {
                let result = new RegExp(/^[0-9A-Fa-f]{12}$/).test(value)
                setIsValid(result)
                if (!isValid) {
                    setErrorText('This field needs to be 12 characters long and must only include hex characters.')
                }
                return result
            }
        }
        if (props.options && hasFlag(props.options.type, FilterType.NUMERICAL)) {
            let validationResult = validateFilterNumber(value.toString(), props.options)
            setIsValid(validationResult[0])
            if (!validationResult[0]) {
                setErrorText(validationResult[1] || '')
                return false
            }
            return true
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
            hasFlag(type, FilterType.NUMERICAL) &&
            hasFlag(type, FilterType.RANGE) &&
            options.options.length === 2 &&
            !isNaN(parseInt(options.options[0])) &&
            !isNaN(parseInt(options.options[1])) &&
            parseInt(options.options[1]) <= 10
        ) {
            return (
                <NumberRangeFilterElement
                    key={options.name}
                    defaultValue={props.defaultValue}
                    min={props.options ? parseInt(props.options.options[0]) : undefined}
                    max={props.options ? parseInt(props.options.options[1]) : undefined}
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
            return (
                <PlayerFilterElement
                    key={options.name}
                    defaultValue={props.defaultValue}
                    isValid={isValid}
                    returnType="uuid"
                    onChange={onFilterElementChange}
                />
            )
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
                return (
                    <EqualFilterElement
                        key={options.name}
                        isValid={isValid}
                        options={options}
                        defaultValue={props.defaultValue}
                        onChange={onFilterElementChange}
                        showIcon={hasFlag(options.type, FilterType.SHOW_ICON)}
                    />
                )
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
                    <Form.Label style={{ float: 'left', display: 'flex', alignContent: 'center' }}>
                        <b style={{ marginRight: 5 }}>
                            {props.options.name[0].toLowerCase() === props.options.name[0]
                                ? convertTagToName(props.options.name)
                                : camelCaseToSentenceCase(props.options.name)}
                        </b>
                        {props.options.description ? (
                            <Tooltip
                                type="hover"
                                content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer' }} />}
                                tooltipContent={<span>{props.options.description}</span>}
                            />
                        ) : null}
                    </Form.Label>
                    {getFilterElement(props.options.type, props.options)}
                    {!isValid ? (
                        <div>
                            <span style={{ color: 'red' }}>{errorText}</span>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}

export default FilterElement
