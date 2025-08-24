'use client'
import Link from 'next/link'
import { Button, Container, Alert, Form, Card, Row, Col } from 'react-bootstrap'
import { getHeadMetadata } from '../utils/SSRUtils'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../api/ApiHelper'

interface ErrorReportData {
    userDescription: string
    includeErrorDetails: boolean
    contactMethod: 'discord' | 'email' | 'none'
}

export default function Custom500({ error, reset }) {
    const [showDetails, setShowDetails] = useState(false)
    const [isReporting, setIsReporting] = useState(false)
    const [hasReported, setHasReported] = useState(false)
    const [autoReportAttempted, setAutoReportAttempted] = useState(false)
    const [reportData, setReportData] = useState<ErrorReportData>({
        userDescription: '',
        includeErrorDetails: true,
        contactMethod: 'none'
    })

    // Attempt automatic error reporting when component mounts
    useEffect(() => {
        if (!autoReportAttempted) {
            setAutoReportAttempted(true)
            attemptAutoReport()
        }
    }, [])

    const attemptAutoReport = async () => {
        try {
            const errorReport = {
                type: 'server_error',
                error: error?.message || 'Unknown server error',
                stack: error?.stack || 'No stack trace available',
                digest: error?.digest || 'No digest available',
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                automaticReport: true
            }

            await api.sendFeedback('server_error_auto', errorReport)
            console.log('Automatic error report sent successfully')
        } catch (reportError) {
            console.error('Failed to send automatic error report:', reportError)
            // Don't show this error to the user, as it's secondary to the main error
        }
    }

    const handleManualReport = async () => {
        setIsReporting(true)
        try {
            const errorReport = {
                otherIssue : true,
                additionalInformation: JSON.stringify({
                    userDescription: reportData.userDescription,
                    type: 'server_error_manual',
                    error: error?.message || 'Unknown server error',
                    stack: reportData.includeErrorDetails ? (error?.stack || 'No stack trace available') : 'User opted not to include technical details',
                    digest: reportData.includeErrorDetails ? (error?.digest || 'No digest available') : 'Not included',
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                })
            } as ReloadFeedback

            await api.sendFeedback('server_error_manual', errorReport)
            toast.success('Error report sent successfully! Thank you for helping us improve.')
            setHasReported(true)
        } catch (reportError) {
            toast.error('Failed to send error report. Please try contacting us directly.')
            console.error('Manual error report failed:', reportError)
        } finally {
            setIsReporting(false)
        }
    }

    const errorTitle = error?.message ? `Error: ${error.message}` : 'Something went wrong'
    const errorDetails = {
        message: error?.message || 'Unknown error',
        digest: error?.digest || 'No digest available',
        timestamp: new Date().toISOString()
    }

    return (
        <>
            <Container className="mt-4">
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card>
                            <Card.Header className="bg-danger text-white">
                                <h3 className="mb-0">🚨 Oops! Something went wrong</h3>
                            </Card.Header>
                            <Card.Body>
                                <Alert variant="warning">
                                    <p className="mb-2">
                                        <strong>We're sorry!</strong> An unexpected error occurred while processing your request.
                                    </p>
                                    <p className="mb-0">
                                        <small>Don't worry - we've been automatically notified and will investigate this issue.</small>
                                    </p>
                                </Alert>

                                <div className="mb-3">
                                    <h5>What you can do:</h5>
                                    <ul className="mb-3">
                                        <li>Try refreshing the page</li>
                                        <li>Go back to the main page and try again</li>
                                        <li>Report this error with additional details (optional)</li>
                                    </ul>
                                </div>

                                <div className="d-grid gap-2 mb-3">
                                    <Button variant="primary" onClick={() => window.location.reload()}>
                                        🔄 Refresh Page
                                    </Button>
                                    <Link href="/" className="d-grid">
                                        <Button variant="secondary">
                                            🏠 Return to Main Page
                                        </Button>
                                    </Link>
                                    {reset && (
                                        <Button variant="outline-primary" onClick={reset}>
                                            🔄 Try Again
                                        </Button>
                                    )}
                                </div>

                                {!hasReported && (
                                    <Card className="mb-3">
                                        <Card.Header>
                                            <h6 className="mb-0">📝 Help us fix this (Optional)</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Form>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>What were you trying to do when this error occurred?</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={reportData.userDescription}
                                                        onChange={(e) => setReportData({...reportData, userDescription: e.target.value})}
                                                        placeholder="Describe what you were doing when the error happened..."
                                                    />
                                                </Form.Group>
                                                
                                                <Form.Group className="mb-3">
                                                    <Form.Check
                                                        type="checkbox"
                                                        label="Include technical error details (helps us debug)"
                                                        checked={reportData.includeErrorDetails}
                                                        onChange={(e) => setReportData({...reportData, includeErrorDetails: e.target.checked})}
                                                    />
                                                </Form.Group>

                                                <Button
                                                    variant="success"
                                                    onClick={handleManualReport}
                                                    disabled={isReporting}
                                                    className="w-100"
                                                >
                                                    {isReporting ? '📤 Sending...' : '📤 Send Error Report'}
                                                </Button>
                                            </Form>
                                        </Card.Body>
                                    </Card>
                                )}

                                {hasReported && (
                                    <Alert variant="success">
                                        <h6>✅ Thank you!</h6>
                                        <p className="mb-0">Your error report has been sent successfully. We appreciate your help in making our service better!</p>
                                    </Alert>
                                )}

                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">💬 Need immediate help?</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-3">If you need assistance right away, you can reach us directly:</p>
                                        <div className="d-grid gap-2">
                                            <a
                                                href="https://discord.gg/wvKXfTgCfb"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-primary"
                                            >
                                                💬 Join our Discord
                                            </a>
                                            <a
                                                href="mailto:support@coflnet.com"
                                                className="btn btn-outline-primary"
                                            >
                                                📧 Email Support
                                            </a>
                                        </div>
                                    </Card.Body>
                                </Card>

                                <div className="mt-3 text-center">
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setShowDetails(!showDetails)}
                                    >
                                        {showDetails ? '🔼 Hide' : '🔽 Show'} Technical Details
                                    </Button>
                                </div>

                                {showDetails && (
                                    <Alert variant="secondary" className="mt-2">
                                        <h6>Technical Details:</h6>
                                        <pre style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                                            {JSON.stringify(errorDetails, null, 2)}
                                        </pre>
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Error')
