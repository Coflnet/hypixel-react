import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { Button, Container, Card } from 'react-bootstrap'
import Search from '../components/Search/Search'

function Cancel() {
    return (
        <div className="page">
            <Head>
                <title>Payment canceled</title>
            </Head>
            <Container>
                <Search />
                <Card>
                    <Card.Header>
                        <Card.Title style={{ color: 'firebrick' }}>Your canceled the payment process</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <p>It seems you decided to not buy premium. We are sorry to hear that. Maybe you will change your mind in the future :)</p>
                        <p>
                            If you encountered a problem, feel free to contact us via the <Link href="/feedback">Feedback site</Link>
                        </p>
                        <Link href="/">
                            <Button>Back to the main page</Button>
                        </Link>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}

export default Cancel
