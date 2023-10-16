'use client'
import Link from 'next/link'
import { Button } from 'react-bootstrap'
import { Container } from 'react-bootstrap'
import { getHeadMetadata } from '../utils/SSRUtils'

export default function Custom500({ error }) {
    return (
        <>
            <Container>
                <h1>500 - Server-side error occurred</h1>
                <Link href="/" className="disableLinkStyle">
                    <Button>Return to main page</Button>
                </Link>
                <p>{JSON.stringify(error)}</p>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Error')
