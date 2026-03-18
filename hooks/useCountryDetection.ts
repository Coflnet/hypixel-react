'use client'
import { useEffect, useRef, useState } from 'react'
import { Country, getCountry, getCountryFromUserLanguage } from '../utils/CountryUtils'
import { USER_COUNTRY_CODE } from '../utils/SettingsUtils'

function persistCountry(country: Country) {
    try {
        if (country.value) {
            localStorage.setItem('countryCode', country.value)
            localStorage.setItem(USER_COUNTRY_CODE, country.value)
        }
    } catch { }
}

export function useCountryDetection(onCountryCodeChange?: (countryCode: string) => void) {
    const [selectedCountry, setSelectedCountry] = useState<Country>()
    const [defaultCountry, setDefaultCountry] = useState<Country>()
    const callbackRef = useRef(onCountryCodeChange)
    callbackRef.current = onCountryCodeChange

    const applyCountry = (country: Country | undefined) => {
        if (!country) return
        setDefaultCountry(country)
        setSelectedCountry(country)
        persistCountry(country)
        if (callbackRef.current && country.value) {
            callbackRef.current(country.value)
        }
    }

    const handleCountryChange = (country: Country) => {
        setSelectedCountry(country)
        persistCountry(country)
        if (callbackRef.current && country.value) {
            callbackRef.current(country.value)
        }
    }

    useEffect(() => {
        async function detect() {
            const cachedCode = localStorage.getItem(USER_COUNTRY_CODE)
            if (cachedCode) {
                applyCountry(getCountry(cachedCode))
                return
            }

            let detectedCountry: Country | undefined
            try {
                const response = await fetch('https://api.country.is')
                if (response.ok) {
                    const result = await response.json()
                    detectedCountry = getCountry(result.country)
                }
            } catch {
                console.error('Failed to fetch country from api.country.is')
            }

            applyCountry(detectedCountry || getCountryFromUserLanguage())
        }
        detect()
    }, [])

    return { selectedCountry, defaultCountry, handleCountryChange }
}
