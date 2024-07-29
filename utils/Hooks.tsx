import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import api from '../api/ApiHelper'
import { CUSTOM_EVENTS } from '../api/ApiTypes.d'
import { getCurrentCoflCoins, subscribeToCoflcoinChange } from './CoflCoinsUtils'
import { isClientSideRendering } from './SSRUtils'
import { getURLSearchParam } from './Parser/URLParser'
import { useRouter } from 'next/navigation'

export function useForceUpdate() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [update, setUpdate] = useState(0)
    return () => setUpdate(update => update + 1)
}

export function useSwipe(onSwipeUp?: Function, onSwipeRight?: Function, onSwipeDown?: Function, onSwipeLeft?: Function) {
    if (!isClientSideRendering()) {
        return
    }

    document.addEventListener('touchstart', handleTouchStart, false)
    document.addEventListener('touchmove', handleTouchMove, false)

    var xDown = null
    var yDown = null

    function getTouches(evt) {
        return (
            evt.touches || // browser API
            evt.originalEvent.touches
        ) // jQuery
    }

    function handleTouchStart(evt) {
        const firstTouch = getTouches(evt)[0]
        xDown = firstTouch.clientX
        yDown = firstTouch.clientY
    }

    function handleTouchMove(evt) {
        if (xDown === null || yDown === null) {
            return
        }

        var xUp = evt.touches[0].clientX
        var yUp = evt.touches[0].clientY

        var xDiff = xDown! - xUp
        var yDiff = yDown! - yUp

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            /*most significant*/
            if (xDiff > 0) {
                if (onSwipeLeft) {
                    onSwipeLeft()
                }
            } else {
                if (onSwipeRight) {
                    onSwipeRight()
                }
            }
        } else {
            if (yDiff > 0) {
                if (onSwipeUp) {
                    onSwipeUp()
                }
            } else {
                if (onSwipeDown) {
                    onSwipeDown()
                }
            }
        }
        /* reset values */
        xDown = null
        yDown = null
    }

    return () => {
        document.removeEventListener('touchstart', handleTouchStart, false)
        document.removeEventListener('touchmove', handleTouchMove, false)
    }
}

export function useCoflCoins() {
    const [coflCoins, setCoflCoins] = useState(getCurrentCoflCoins())

    useEffect(() => {
        let unsubscribe = subscribeToCoflcoinChange(setCoflCoins)

        return () => {
            unsubscribe()
        }
    }, [])

    return coflCoins
}

export function useWasAlreadyLoggedIn() {
    const [wasAlreadyLoggedIn, setWasAlreadyLoggedIn] = useState(false)
    useEffect(() => {
        setWasAlreadyLoggedIn(localStorage.getItem('googleId') !== null)
    }, [])

    return wasAlreadyLoggedIn
}

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])
    return debouncedValue
}

type ReadonlyRef<T> = {
    readonly current: T
}

export function useStateWithRef<T>(defaultValue: T): [T, Dispatch<SetStateAction<T>>, ReadonlyRef<T>] {
    const [state, _setState] = useState(defaultValue)
    let stateRef = useRef(state)

    const setState: typeof _setState = useCallback((newState: T) => {
        stateRef.current = newState
        _setState(newState)
    }, [])

    return [state, setState, stateRef]
}

export function useQueryParamState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [state, setState] = useState<T>(getDefaultValue() || defaultValue)
    const router = useRouter()

    function getDefaultValue(): T | undefined {
        let param = getURLSearchParam(key)
        if (!param) {
            return undefined
        }
        return JSON.parse(decodeURIComponent(param)) as T
    }

    function _setState(newState: T) {
        setState(newState)
        let urlparams = new URLSearchParams(window.location.search)
        urlparams.set(key, encodeURIComponent(JSON.stringify(newState)))
        router.replace(`${window.location.pathname}?${urlparams.toString()}`)
    }

    return [state, _setState]
}
