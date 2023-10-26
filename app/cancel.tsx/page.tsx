import Link from 'next/link'
import React from 'react'
import Search from '../../components/Search/Search'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { Container, Card, CardHeader, CardTitle, CardBody, Button } from 'react-bootstrap'

export default function Page() {
    return (
        <>
            <Container>
                <Search />
                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: 'firebrick' }}>Your canceled the payment process</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <p>It seems you decided to not buy premium. We are sorry to hear that. Maybe you will change your mind in the future :)</p>
                        <p>
                            If you encountered a problem, feel free to contact us via the <Link href="/feedback">Feedback site</Link>
                        </p>
                        <Link href="/" className="disableLinkStyle">
                            <Button>Back to the main page</Button>
                        </Link>
                    </CardBody>
                </Card>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Payment canceled')
