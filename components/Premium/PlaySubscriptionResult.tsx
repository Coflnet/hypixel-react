'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePlaySubscriptionResult } from '../../hooks/usePlaySubscriptionResult'
import { getPlaySubscriptionLabel } from '../../utils/PlaySubscriptions'

export default function PlaySubscriptionResult({ children }: { children: ReactNode }) {
    const result = usePlaySubscriptionResult(true)
    if (!result) return children
    return (
        <>
            <h2>{getPlaySubscriptionLabel(result.slug)} subscription purchase</h2>
            <p>{result.error}</p>
            <p>
                <Link href="/premium" className="btn btn-primary">
                    Return to Premium
                </Link>
            </p>
        </>
    )
}
