import React from 'react'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import { getHeadMetadata } from '../../utils/SSRUtils'
import Premium from '../../components/Premium/Premium'

export default function Page() {
    return (
        <>
            <RBContainer>
                <Premium />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Premium', 'See available premium options to support this project')
