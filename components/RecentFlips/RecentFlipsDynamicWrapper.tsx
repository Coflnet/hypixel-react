'use client'

import dynamic from 'next/dynamic'

const RecentFlips = dynamic(() => import('../../components/RecentFlips/RecentFlips').then(mod => mod.RecentFlips), { ssr: false })

export default RecentFlips
