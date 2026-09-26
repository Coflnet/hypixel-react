'use client'

import { useEffect } from 'react'
import api from '../../api/ApiHelper'
import usePremiumRefresh from '../../hooks/usePremiumRefresh'

async function refresh() {
    if (sessionStorage.getItem('googleId') || localStorage.getItem('googleId')) {
        await api.getPremiumProducts(true)
    }
}

export default function PaymentStatusRefresh() {
    usePremiumRefresh(true, refresh)
    useEffect(() => {
        void refresh().catch(() => {})
    }, [])
    return null
}
