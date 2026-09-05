'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Container } from 'react-bootstrap'
import { getGeneratedApiMessage } from '../../utils/GeneratedApiResponseUtils'
import api from '../../api/ApiHelper'
import { ClientErrorRecord, getClientErrorLog, recordClientError } from '../../utils/ClientErrorUtils'
import { serializeError } from '../../utils/ErrorDiagnostics'
import { writeToClipboard } from '../../utils/ClipboardUtils'

export function Error({ title, errorObject, errorMessage, onRetry }: { title: string; errorObject?: any; errorMessage?: string; onRetry?(): void }) {
    const derivedMessage = errorMessage || getGeneratedApiMessage(errorObject) || 'Something went wrong while loading this page.'
    const details = serializeError(errorObject ?? derivedMessage)
    const [record, setRecord] = useState<ClientErrorRecord>()
    const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

    useEffect(() => {
        setRecord(recordClientError(errorObject ?? derivedMessage, 'react-boundary'))
        setReportStatus('idle')
    }, [errorObject, derivedMessage])

    async function sendReport() {
        if (!record) return
        setReportStatus('sending')
        try {
            await api.sendFeedback('web-error', { reportId: record.id, ...record })
            setReportStatus('sent')
        } catch {
            setReportStatus('failed')
        }
    }

    return (
        <Container>
            <h1>{title}</h1>
            <p>{details.digest ? 'The server could not finish loading this page. Please try again.' : derivedMessage}</p>
            <p>If the problem continues, send an error report or copy the details when contacting support.</p>
            {details.slug ? (
                <p>
                    Error code: <code>{details.slug}</code>
                </p>
            ) : null}
            {details.traceId ? (
                <p>
                    Server trace ID: <code>{details.traceId}</code>
                </p>
            ) : null}
            {details.digest ? (
                <p>
                    Server error reference: <code>{details.digest}</code>
                </p>
            ) : null}
            {record ? (
                <p>
                    Report reference: <code>{record.id}</code>
                </p>
            ) : null}
            {errorObject ? (
                <details>
                    <summary>Technical details</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(record ?? details, null, 2)}</pre>
                </details>
            ) : null}

            <div className="d-flex flex-wrap gap-2 mt-3">
                {onRetry ? <Button onClick={onRetry}>Retry page</Button> : null}
                <Button variant="secondary" disabled={!record || reportStatus === 'sending' || reportStatus === 'sent'} onClick={() => void sendReport()}>
                    {reportStatus === 'sending' ? 'Sending report…' : reportStatus === 'sent' ? 'Report sent' : 'Send error report'}
                </Button>
                <Button
                    variant="secondary"
                    disabled={!record}
                    onClick={() => writeToClipboard(JSON.stringify({ ...record, errorLog: getClientErrorLog() }, null, 2))}
                >
                    Copy error details
                </Button>
                <Link href="/" className="btn btn-secondary">
                    Return to main page
                </Link>
            </div>
            {reportStatus === 'sent' ? <p role="status">Thank you. The report includes the available error details and stack traces.</p> : null}
            {reportStatus === 'failed' ? <p role="alert">The report could not be sent. Try again or copy the error details to share with support.</p> : null}
        </Container>
    )
}
