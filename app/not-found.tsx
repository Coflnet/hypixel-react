'use client'
import Link from 'next/link'
import { Button, Container } from 'react-bootstrap'
import { getHeadMetadata } from '../utils/SSRUtils'

export default function NotFound() {
    return (
        <>
            <Container>
                <h1>Oops, seems something went wrong</h1>
                <p>There is nothing to see here.</p>
                <p>
                    <small>Error 404</small>
                </p>
                <Link href="/" className="disableLinkStyle">
                    <Button>Go back</Button>
                </Link>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Not found')
