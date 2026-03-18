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
            let cachedCode: string | null = null
            try {
                const storedUserCode = localStorage.getItem(USER_COUNTRY_CODE)
                const legacyCode = localStorage.getItem('countryCode')
                cachedCode = storedUserCode || legacyCode
            } catch {
                cachedCode = null
            }

            if (cachedCode) {
                const normalizedCode = cachedCode.toUpperCase()
                const cachedCountry = getCountry(normalizedCode)
                if (cachedCountry) {
                    applyCountry(cachedCountry)
                    return
                }
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

            const fallbackCountry = detectedCountry || getCountryFromUserLanguage() || getCountry('US')
            applyCountry(fallbackCountry)
        }
        detect()
    }, [])

    return { selectedCountry, defaultCountry, handleCountryChange }
}
