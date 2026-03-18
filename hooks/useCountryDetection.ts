'use client'
import { useEffect, useRef, useState } from 'react'
import { Country, getCountry, getCountryFromUserLanguage } from '../utils/CountryUtils'
import { USER_COUNTRY_CODE } from '../utils/SettingsUtils'

export function useCountryDetection(onCountryCodeChange?: (countryCode: string) => void) {
    const [selectedCountry, setSelectedCountry] = useState<Country>()
    const [defaultCountry, setDefaultCountry] = useState<Country>()
    const callbackRef = useRef(onCountryCodeChange)
    const hasUserSelected = useRef(false)
    callbackRef.current = onCountryCodeChange

    function persistCountry(country: Country) {
        try {
            if (country.value) {
                localStorage.setItem(USER_COUNTRY_CODE, country.value)
            }
        } catch {
            console.error('Failed to persist country to storage')
        }
    }

    const applyCountry = (country: Country | undefined) => {
        if (!country) return
        if (hasUserSelected.current) return
        setDefaultCountry(country)
        setSelectedCountry(country)
        persistCountry(country)
        if (callbackRef.current && country.value) {
            callbackRef.current(country.value)
        }
    }

    const handleCountryChange = (country: Country) => {
        hasUserSelected.current = true
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
                cachedCode = localStorage.getItem(USER_COUNTRY_CODE)
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
