'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { getLoadingElement } from '../../../utils/LoadingUtils'

// Dynamically import the heavy AuctionHousePriceGraph component
const AuctionHousePriceGraphDynamic = dynamic(() => import('./AuctionHousePriceGraph'), {
    loading: () => getLoadingElement(),
    ssr: false
})

interface Props {
    item: Item
}

export default function AuctionHousePriceGraphLazy(props: Props) {
    const [shouldLoad, setShouldLoad] = useState(false)

    useEffect(() => {
        // Defer chart loading to after initial render and critical content
        // 1.5s gives enough time for LCP while ensuring charts load soon
        const timer = setTimeout(() => setShouldLoad(true), 1500)
        return () => clearTimeout(timer)
    }, [])

    if (!shouldLoad) {
        return getLoadingElement()
    }

    return <AuctionHousePriceGraphDynamic {...props} />
}
