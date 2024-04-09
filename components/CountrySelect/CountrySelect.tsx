'use client'
import { useRef, useState } from 'react'
import { Menu, MenuItem, Typeahead } from 'react-bootstrap-typeahead'
import { Form, InputGroup } from 'react-bootstrap'
import { Country, getCountries } from '../../utils/CountryUtils'
import { default as TypeaheadType } from 'react-bootstrap-typeahead/types/core/Typeahead'

interface Props {
    onCountryChange?(country: Country)
    defaultCountry?: Country
    isLoading?: boolean
}

export default function CountrySelect(props: Props) {
    const countryOptions = getCountries()
    let [selectedCountry, setSelectedCountryCode] = useState<any>(props.defaultCountry)
    let ref = useRef<TypeaheadType>(null)

    function getCountryImage(countryCode: string): JSX.Element {
        return (
            <img
                src={`https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png`}
                srcSet={`https://flagcdn.com/32x24/${countryCode.toLowerCase()}.png 2x, https://flagcdn.com/48x36/${countryCode.toLowerCase()}.png 3x`}
                width="16"
                height="12"
                alt={countryCode}
                style={{ marginRight: '5px' }}
            />
        )
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, paddingBottom: 15 }}>
            <label htmlFor="countryTypeahead">Your Country: </label>
            <Typeahead
                id="countryTypeahead"
                style={{ width: 'auto' }}
                disabled={props.isLoading}
                placeholder={props.isLoading ? 'Loading...' : 'Select your country'}
                ref={ref}
                defaultSelected={selectedCountry ? [selectedCountry] : []}
                isLoading={props.isLoading}
                onChange={e => {
                    if (e[0]) {
                        setSelectedCountryCode(e[0])
                        if (props.onCountryChange) {
                            props.onCountryChange(e[0] as Country)
                        }
                    }
                }}
                labelKey={option => {
                    return option ? (option as any).label : ''
                }}
                onFocus={e => {
                    if (ref.current) {
                        ref.current.clear()
                    }
                }}
                options={countryOptions}
                selectHint={(shouldSelect, event) => {
                    return event.key === 'Enter' || shouldSelect
                }}
                renderInput={({ inputRef, referenceElementRef, ...inputProps }) => {
                    return (
                        <InputGroup>
                            <InputGroup.Text>{selectedCountry ? getCountryImage(selectedCountry.value) : <div style={{ minWidth: 16 }} />}</InputGroup.Text>
                            <Form.Control
                                {...(inputProps as any)}
                                ref={input => {
                                    inputRef(input)
                                    referenceElementRef(input)
                                }}
                            />
                        </InputGroup>
                    )
                }}
                renderMenu={(results, menuProps) => (
                    <Menu {...menuProps}>
                        {results.map((result, index) => {
                            let element = result as { label: string; value: string; paginationOption?: boolean }
                            if (element.paginationOption) {
                                return (
                                    <MenuItem option={element} position={index}>
                                        More results...
                                    </MenuItem>
                                )
                            }
                            if (!element || !element.label || !element.value) {
                                return <MenuItem option={element} position={index} />
                            }
                            return (
                                <MenuItem key={element.value} option={element} position={index}>
                                    {getCountryImage(element.value)}
                                    {element.label}
                                </MenuItem>
                            )
                        })}
                    </Menu>
                )}
            ></Typeahead>
        </div>
    )
}
