import countryList from 'react-select-country-list'
import { isClientSideRendering } from './SSRUtils'

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

export function getCountryFromUserLanguage(): Country | undefined {
    if (!isClientSideRendering()) {
        return undefined
    }
    let language = navigator.language
    if (!language) {
        language = 'en-US'
    }
    if (language.includes('-')) {
        language = language.split('-')[1]
    }
    return getCountries().find(country => country.value.toLowerCase() === language.toLowerCase())
}
