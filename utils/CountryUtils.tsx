import countryList from 'react-select-country-list'

export interface Country {
    label: string
    value: string
}

let countries
export function getCountries(): Country[] {
    if (countries) {
        return countries
    }
    let result = countryList().getData()
    countries = result
    return result
}

export function getCountry(countryCode?: string) {
    return getCountries().find(country => country.value === countryCode)
}
