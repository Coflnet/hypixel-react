'use client'
import React, { useEffect, useState } from 'react'
import { Alert, Button, Card, Spinner, Tab, Tabs } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { CopyButton } from '../CopyButton/CopyButton'

const API_BASE = 'https://sky.coflnet.com/api'

interface BlacklistStatus {
    ip: string
    banned: boolean
}

interface UnblockResult {
    ip: string
    unblocked: boolean
    wasBanned: boolean
}

export default function ApiAccessStatus() {
    const [token, setToken] = useState<string | null>(null)
    const [status, setStatus] = useState<BlacklistStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [unblocking, setUnblocking] = useState(false)
    const [hasPremiumPlus, setHasPremiumPlus] = useState<boolean | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem('googleId')
        if (stored) {
            setToken(stored)
        }
    }, [])

    const checkStatus = async () => {
        setLoading(true)
        try {
            const headers: Record<string, string> = {}
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(`${API_BASE}/blacklist/status`, { headers })
            if (res.ok) {
                const data: BlacklistStatus = await res.json()
                setStatus(data)
            }
        } catch {
            toast.error('Failed to check blacklist status')
        }
        setLoading(false)
    }

    const checkPremiumPlus = async () => {
        if (!token) return
        try {
            const res = await fetch(`${API_BASE}/premium/user/owns`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(['premium_plus'])
            })
            if (res.ok) {
                const data: Record<string, string> = await res.json()
                const expiry = data['premium_plus']
                setHasPremiumPlus(expiry ? new Date(expiry) > new Date() : false)
            }
        } catch {
            setHasPremiumPlus(false)
        }
    }

    const unblock = async () => {
        if (!token) {
            toast.error('You need to be logged in to unblock your IP')
            return
        }
        setUnblocking(true)
        try {
            const res = await fetch(`${API_BASE}/blacklist/unblock`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data: UnblockResult = await res.json()
                if (data.unblocked) {
                    toast.success('Your IP has been unblocked!')
                    setStatus(prev => prev ? { ...prev, banned: false } : null)
                }
            } else {
                const err = await res.json()
                if (err.error === 'premium_plus_required') {
                    toast.error('Premium+ subscription required to unblock')
                    setHasPremiumPlus(false)
                } else {
                    toast.error(err.message || 'Failed to unblock')
                }
            }
        } catch {
            toast.error('Failed to unblock IP')
        }
        setUnblocking(false)
    }

    useEffect(() => {
        checkStatus()
        if (token) checkPremiumPlus()
    }, [token])

    return (
        <Card className="mb-4">
            <Card.Header>
                <h4 className="mb-0">API Access Status</h4>
            </Card.Header>
            <Card.Body>
                {/* Token Section */}
                <div className="mb-3">
                    <h5>Your API Token</h5>
                    {token ? (
                        <div>
                            <Alert variant="success" className="d-flex align-items-center justify-content-between">
                                <span>Token found (from your login)</span>
                                <CopyButton copyValue={token} buttonVariant="outline-light" />
                            </Alert>
                            <p className="text-muted small">
                                This is the token stored in your browser from logging in. Pass it as an <code>Authorization: Bearer</code> header to authenticate API requests.
                            </p>
                        </div>
                    ) : (
                        <Alert variant="warning">
                            Not logged in. <a href="/premium">Log in</a> first to see your token and manage API access.
                        </Alert>
                    )}
                </div>

                {/* Blacklist Status */}
                <div className="mb-3">
                    <h5>IP Blacklist Status</h5>
                    {loading ? (
                        <Spinner animation="border" size="sm" />
                    ) : status ? (
                        <div>
                            <p>Your IP: <code>{status.ip}</code></p>
                            {status.banned ? (
                                <Alert variant="danger">
                                    <strong>Your IP is currently blocked.</strong>
                                    {hasPremiumPlus === true ? (
                                        <div className="mt-2">
                                            <p>As a Premium+ subscriber, you can unblock your IP:</p>
                                            <Button variant="success" onClick={unblock} disabled={unblocking}>
                                                {unblocking ? <Spinner animation="border" size="sm" /> : 'Unblock My IP'}
                                            </Button>
                                        </div>
                                    ) : hasPremiumPlus === false ? (
                                        <div className="mt-2">
                                            <p>You need <strong>Premium+</strong> to unblock your IP and get higher rate limits.</p>
                                            <Button variant="primary" href="/premium">Get Premium+</Button>
                                        </div>
                                    ) : !token ? (
                                        <div className="mt-2">
                                            <p><a href="/premium">Log in</a> and subscribe to Premium+ to unblock your IP.</p>
                                        </div>
                                    ) : null}
                                </Alert>
                            ) : (
                                <Alert variant="success">Your IP is not blocked.</Alert>
                            )}
                            <Button variant="outline-secondary" size="sm" onClick={checkStatus} disabled={loading}>
                                Refresh Status
                            </Button>
                        </div>
                    ) : null}
                </div>

                {/* Usage Examples */}
                {token && (
                    <div>
                        <h5>How to use your token</h5>
                        <p>Pass the <code>Authorization: Bearer</code> header with your requests. Premium+ users bypass IP rate limits and blocks.</p>
                        <Tabs defaultActiveKey="curl" className="mb-3">
                            <Tab eventKey="curl" title="cURL">
                                <pre className="bg-dark text-light p-3 rounded position-relative">
                                    <CopyButton
                                        copyValue={`curl -H "Authorization: Bearer ${token}" https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot`}
                                        buttonVariant="outline-light"
                                        buttonClass="position-absolute top-0 end-0 m-2"
                                    />
                                    {`curl -H "Authorization: Bearer ${token}" \\
  https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot`}
                                </pre>
                            </Tab>
                            <Tab eventKey="python" title="Python">
                                <pre className="bg-dark text-light p-3 rounded position-relative">
                                    <CopyButton
                                        copyValue={`import requests\n\nheaders = {"Authorization": "Bearer ${token}"}\nresponse = requests.get(\n    "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot",\n    headers=headers\n)\nprint(response.json())`}
                                        buttonVariant="outline-light"
                                        buttonClass="position-absolute top-0 end-0 m-2"
                                    />
                                    {`import requests

headers = {"Authorization": "Bearer ${token}"}
response = requests.get(
    "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot",
    headers=headers
)
print(response.json())`}
                                </pre>
                            </Tab>
                            <Tab eventKey="javascript" title="JavaScript">
                                <pre className="bg-dark text-light p-3 rounded position-relative">
                                    <CopyButton
                                        copyValue={`const response = await fetch(\n  "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot",\n  { headers: { "Authorization": "Bearer ${token}" } }\n);\nconst data = await response.json();\nconsole.log(data);`}
                                        buttonVariant="outline-light"
                                        buttonClass="position-absolute top-0 end-0 m-2"
                                    />
                                    {`const response = await fetch(
  "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot",
  { headers: { "Authorization": "Bearer ${token}" } }
);
const data = await response.json();
console.log(data);`}
                                </pre>
                            </Tab>
                        </Tabs>
                    </div>
                )}
            </Card.Body>
        </Card>
    )
}
