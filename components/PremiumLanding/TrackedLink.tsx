'use client'
import { ReactNode } from 'react'
import { usePremiumVariant } from '../Premium/PremiumVariantContext'
import { EventDetails, PremiumPageAction, trackPremiumPageEvent } from '../../utils/PremiumTracking'

interface Props {
    href: string
    className?: string
    action: PremiumPageAction
    details?: EventDetails
    children: ReactNode
}

/** a plain in-page link (server-rendered) that also reports a premium page event when clicked */
export default function TrackedLink({ href, className, action, details, children }: Props) {
    const variant = usePremiumVariant()
    return (
        <a href={href} className={className} onClick={() => trackPremiumPageEvent(action, variant, details)}>
            {children}
        </a>
    )
}
