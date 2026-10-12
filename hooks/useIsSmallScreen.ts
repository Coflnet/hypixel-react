'use client'
import { useEffect, useState } from 'react'

const SMALL_SCREEN_WIDTH = 1500

/** true when the page body is narrower than the navbar layout needs; evaluated once after mount */
export function useIsSmallScreen(): boolean {
    const [isSmall, setIsSmall] = useState(false)
    useEffect(() => {
        setIsSmall(document.body.clientWidth < SMALL_SCREEN_WIDTH)
    }, [])
    return isSmall
}
