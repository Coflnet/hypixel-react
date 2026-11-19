'use client'
import { useSyncExternalStore } from 'react'
import { Country, getCountry } from '../utils/CountryUtils'
import { detectVisitorCountryCode } from '../utils/CountryDetection'

// The buyer's country for prices, taxes and the payment providers. One state for the whole page: every country select
// and price shows the same country. Nothing is stored on the device. An unknown country stays unknown (no guessed
// default): prices are then shown before tax and a checkout needs the buyer to pick the country first.
// A failed, blocked or timed out detection ends the detection, so the buyer can pick the country.

interface CountryState {
    country?: Country
    /** true until the automatic detection has answered */
    detecting: boolean
}

const SERVER_STATE: CountryState = { detecting: true }

let state: CountryState = SERVER_STATE
let detectionStarted = false
const listeners = new Set<() => void>()

function setState(next: CountryState) {
    state = next
    listeners.forEach(listener => listener())
}

/** a country the buyer picked meanwhile wins over the detected one */
function startDetection() {
    if (detectionStarted) return
    detectionStarted = true
    void detectVisitorCountryCode().then(code => {
        setState({ country: state.country ?? getCountry(code), detecting: false })
    })
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    startDetection()
    return () => {
        listeners.delete(listener)
    }
}

/** the buyer's country (undefined while unknown) and whether its detection is still running */
export function useCountryDetection() {
    const current = useSyncExternalStore(
        subscribe,
        () => state,
        () => SERVER_STATE
    )

    function handleCountryChange(country: Country) {
        setState({ country, detecting: false })
    }

    return { selectedCountry: current.country, isDetecting: current.detecting && !current.country, handleCountryChange }
}
