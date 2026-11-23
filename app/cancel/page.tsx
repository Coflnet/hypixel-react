import Link from 'next/link'
import React from 'react'
import Search from '../../components/Search/Search'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { Container, Card, CardHeader, CardTitle, CardBody } from 'react-bootstrap'
import PlaySubscriptionResult from '../../components/Premium/PlaySubscriptionResult'

export default function Page() {
    return (
        <>
            <Container>
                <Search />
                <PlaySubscriptionResult>
                    <Card>
                        <CardHeader>
                            <CardTitle style={{ color: 'firebrick' }}>You canceled the payment process</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <p>It seems you decided to not buy premium. We are sorry to hear that. Maybe you will change your mind in the future :)</p>
                            <p>
                                If you encountered a problem, feel free to contact us via the <Link href="/feedback">Feedback site</Link>
                            </p>
                            <div className="d-flex gap-2 flex-wrap">
                                <Link href="/premium" className="btn btn-primary">
                                    Back to Premium
                                </Link>
                                <Link href="/" className="btn btn-secondary">
                                    Back to the main page
                                </Link>
                            </div>
                        </CardBody>
                    </Card>
                </PlaySubscriptionResult>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Payment Canceled',
    'Payment was canceled. No charges were made to your account. You can still access our free Hypixel SkyBlock tools or try upgrading to premium again anytime.',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/cancel')
)
