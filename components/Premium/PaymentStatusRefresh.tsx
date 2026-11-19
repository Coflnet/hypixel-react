'use client'

import { useEffect } from 'react'
import api from '../../api/ApiHelper'
import usePremiumRefresh from '../../hooks/usePremiumRefresh'

/** reloads the cached premium ownership every page reads (no-op when logged out) */
export async function refreshPremiumProducts() {
    if (sessionStorage.getItem('googleId') || localStorage.getItem('googleId')) {
        await api.getPremiumProducts(true)
    }
}

export default function PaymentStatusRefresh() {
    usePremiumRefresh(true, refreshPremiumProducts)
    useEffect(() => {
        void refreshPremiumProducts().catch(() => {})
    }, [])
    return null
}
