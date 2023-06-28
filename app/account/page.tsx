import React from 'react'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import AccountDetails from '../../components/AccountDetails/AccountDetails'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default function Page() {
    return (
        <>
            <RBContainer>
                <AccountDetails />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Account', 'Check your account details')
