import React from 'react'
import AccountDetails from '../../components/AccountDetails/AccountDetails'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { Container } from 'react-bootstrap'

export default function Page() {
    return (
        <>
            <Container>
                <AccountDetails />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Account', 'Check your account details')
