import Link from 'next/link'
import React from 'react'
import Search from '../../components/Search/Search'
import { getHeadMetadata } from '../../utils/SSRUtils'
import RBButton from '../../components/ReactBootstrapWrapper/Button'
import RBCard from '../../components/ReactBootstrapWrapper/Card'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import RBCardBody from '../../components/ReactBootstrapWrapper/RBCardBody'
import RBCardHeader from '../../components/ReactBootstrapWrapper/RBCardHeader'
import RBCardTitle from '../../components/ReactBootstrapWrapper/RBCardTitle'

export default function Page() {
    return (
        <>
            <RBContainer>
                <Search />
                <RBCard>
                    <RBCardHeader>
                        <RBCardTitle style={{ color: 'firebrick' }}>Your canceled the payment process</RBCardTitle>
                    </RBCardHeader>
                    <RBCardBody>
                        <p>It seems you decided to not buy premium. We are sorry to hear that. Maybe you will change your mind in the future :)</p>
                        <p>
                            If you encountered a problem, feel free to contact us via the <Link href="/feedback">Feedback site</Link>
                        </p>
                        <Link href="/" className="disableLinkStyle">
                            <RBButton>Back to the main page</RBButton>
                        </Link>
                    </RBCardBody>
                </RBCard>
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Payment canceled')
