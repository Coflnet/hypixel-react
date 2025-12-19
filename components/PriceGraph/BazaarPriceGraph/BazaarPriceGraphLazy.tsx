'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { getLoadingElement } from '../../../utils/LoadingUtils'

// Dynamically import the heavy BazaarPriceGraph component
// This prevents it from blocking the initial page load
const BazaarPriceGraphDynamic = dynamic(() => import('./BazaarPriceGraph'), {
    loading: () => getLoadingElement(),
    ssr: false // Disable SSR for the chart to reduce initial bundle size
})

interface Props {
    item: Item
}

export default function BazaarPriceGraphLazy(props: Props) {
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

    return <BazaarPriceGraphDynamic {...props} />
}
