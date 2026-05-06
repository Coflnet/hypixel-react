import Link from 'next/link'
import { Button, Container } from 'react-bootstrap'
import { getGeneratedApiMessage } from '../../utils/GeneratedApiResponseUtils'

export function Error({ title, errorObject, errorMessage }: { title: string; errorObject?: any; errorMessage?: string }) {
    const derivedMessage = errorMessage || getGeneratedApiMessage(errorObject) || 'Something went wrong while loading this page.'
    const errorSlug = errorObject && typeof errorObject === 'object' && 'slug' in errorObject && typeof errorObject.slug === 'string'
        ? errorObject.slug
        : null

    return (
        <Container>
            <h1>{title}</h1>
            <p>{derivedMessage}</p>
            {errorSlug ? <p>Error code: {errorSlug}</p> : null}
            {errorObject ? (
                <details>
                    <summary>Technical details</summary>
                    <pre>{JSON.stringify(errorObject, null, 2)}</pre>
                </details>
            ) : null}

            <Link href="/" className="disableLinkStyle">
                <Button>Return to main page</Button>
            </Link>
        </Container>
    )
}
