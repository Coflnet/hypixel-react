"use client"
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Number from '../Number/Number'
import { useGetApiFlipBazaarSpread } from '../../api/_generated/skyApi'

export default function BazaarLivePreview() {
  const query = useGetApiFlipBazaarSpread()

  if (query.isLoading) return <p>Loading live bazaar data…</p>
  if (query.isError) return <p>Unable to load live bazaar data.</p>

  const flips = (query.data?.data ?? []) as any[]
  const items = flips.slice(2, 3)

  return (
    <div style={{ marginTop: 12 }}>
      <h3 style={{ marginBottom: 8 }}>Live top Bazaar spreads</h3>
      {items.length === 0 && <p>No live flips found right now.</p>}
      <ul>
        {items.map((f: any) => (
          <li key={f.itemName} style={{ marginBottom: 6 }}>
            <a href={`https://sky.coflnet.com/item/${f.flip?.itemTag}`} target="_blank" rel="noreferrer">
              {f.itemName}
            </a>{' '}
            — profit/hr: <Number number={Math.round((f.flip?.profitPerHour || 0) / 10) * 10} />
          </li>
        ))}
      </ul>
      <p>
        For full details and live orderbook, see <Link href="/bazaar">Bazaar Flips</Link>.
      </p>
    </div>
  )
}
