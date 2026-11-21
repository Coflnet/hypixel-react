'use client'
import { useState } from 'react'
import { Button } from 'react-bootstrap'

const ADDRESS = 'sky.coflnet.com/premium'
const MANUAL_COPY = 'Select the address to copy it manually.'

export default function PremiumWebsiteAddress() {
    const [status, setStatus] = useState('')

    async function copyAddress() {
        if (!navigator.clipboard) {
            setStatus(MANUAL_COPY)
            return
        }
        try {
            await navigator.clipboard.writeText(ADDRESS)
            setStatus('Address copied.')
        } catch {
            setStatus(MANUAL_COPY)
        }
    }

    return (
        <>
            Open your browser and go to <span style={{ userSelect: 'text' }}>{ADDRESS}</span>{' '}
            <Button type="button" variant="secondary" size="sm" onClick={copyAddress}>Copy address</Button>
            <span className="ms-2" role="status">{status}</span>
        </>
    )
}
