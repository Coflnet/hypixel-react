'use client'
import { createContext, ReactNode, useContext, useEffect, useRef } from 'react'
import { PREMIUM_EXPERIMENT, PremiumVariant } from '../../utils/PremiumExperiment'
import { trackExperimentExposure } from '../../utils/PremiumTracking'

const PremiumVariantContext = createContext<PremiumVariant | undefined>(undefined)

/** the /premium A/B variant, or undefined outside the /premium page */
export function usePremiumVariant(): PremiumVariant | undefined {
    return useContext(PremiumVariantContext)
}

/** reports the variant to Matomo once per page view (sent only after consent) to segment visits */
function useExperimentExposure(variant: PremiumVariant | undefined) {
    const reported = useRef(false)
    useEffect(() => {
        if (!variant || reported.current) return
        reported.current = true
        trackExperimentExposure(PREMIUM_EXPERIMENT.name, variant)
    }, [variant])
}

/** `variant` is undefined for visitors outside the experiment (bots): nothing is tracked for them */
export function PremiumVariantProvider({ variant, children }: { variant: PremiumVariant | undefined; children: ReactNode }) {
    useExperimentExposure(variant)
    return <PremiumVariantContext.Provider value={variant}>{children}</PremiumVariantContext.Provider>
}
