import Link from 'next/link'
import React from 'react'
import { Button, Container } from 'react-bootstrap'
import { getHeadElement } from '../utils/SSRUtils'

function NotFound() {
    return (
        <div className="page">
            {getHeadElement('Not found')}
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
        </div>
    )
}

export default NotFound
