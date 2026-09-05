import Link from 'next/link'
import { Button, Container } from 'react-bootstrap'
import { getGeneratedApiMessage } from '../../utils/GeneratedApiResponseUtils'

export function Error({ title, errorObject, errorMessage, onRetry }: { title: string; errorObject?: any; errorMessage?: string; onRetry?(): void }) {
    const derivedMessage = errorMessage || getGeneratedApiMessage(errorObject) || 'Something went wrong while loading this page.'
    const errorSlug = errorObject && typeof errorObject === 'object' && 'slug' in errorObject && typeof errorObject.slug === 'string' ? errorObject.slug : null

    return (
        <Container>
            <h1>{title}</h1>
            <p>{derivedMessage}</p>
            {errorSlug ? <p>Error code: {errorSlug}</p> : null}
            {errorObject ? (
                <details>
                    <summary>Technical details</summary>
                    <pre>
                        {JSON.stringify(
                            errorObject instanceof globalThis.Error ? { ...errorObject, message: errorObject.message, stack: errorObject.stack } : errorObject,
                            null,
                            2
                        )}
                    </pre>
                </details>
            ) : null}

            <div className="d-flex flex-wrap gap-2 mt-3">
                {onRetry ? <Button onClick={onRetry}>Retry page</Button> : null}
                <Link href="/" className="btn btn-secondary">
                    Return to main page
                </Link>
            </div>
        </Container>
    )
}
