import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { Button, Container } from 'react-bootstrap'

function NotFound() {
    return (
        <div className="page">
            <Head>
                <title>Not found</title>
            </Head>
            <Container>
                <h1>Oops, seems something went wrong</h1>
                <p>There is nothing to see here.</p>
                <Link href="/">
                    <Button>Go back</Button>
                </Link>
            </Container>
        </div>
    )
}

export default NotFound
