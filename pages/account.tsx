import React from 'react'
import { Container } from 'react-bootstrap'
import AccountDetails from '../components/AccountDetails/AccountDetails'
import { getHeadElement } from '../utils/SSRUtils'

function PremiumPage() {
    return (
        <div className="page">
            {getHeadElement('Account', 'Check your account details')}
            <Container>
                <AccountDetails />
            </Container>
        </div>
    )
}

export default PremiumPage
