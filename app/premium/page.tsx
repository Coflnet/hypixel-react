import React from 'react'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import Premium from '../../components/Premium/Premium'
import { Container } from 'react-bootstrap'

export default async function Page() {
    return (
        <>
            <Container>
                <Premium />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Premium',
    'Upgrade to premium for advanced Hypixel SkyBlock features: priority flip notifications, enhanced bazaar analysis, exclusive tools, and priority support. Support our project while maximizing your profits.',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/premium')
)
