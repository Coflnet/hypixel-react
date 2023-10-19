'use client'
import { useMemo, useState } from 'react'
import { Menu, MenuItem, Typeahead } from 'react-bootstrap-typeahead'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { Form, InputGroup } from 'react-bootstrap'
import { Country, getCountries, getCountryFromUserLanguage } from '../../utils/CountryUtils'

interface Props {
    onCountryChange(country: Country)
    defaultCountry?: Country
}

export default function CountrySelect(props: Props) {
    const countryOptions = getCountries()
    let [selectedCountry, setSelectedCountryCode] = useState<any>(props.defaultCountry)

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
                defaultSelected={selectedCountry ? [selectedCountry] : []}
                onChange={e => {
                    if (e[0]) {
                        setSelectedCountryCode(e[0])
                        props.onCountryChange(e[0] as Country)
                    }
                }}
                labelKey={option => {
                    return option ? (option as any).label : ''
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
