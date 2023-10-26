import React from 'react'
import { getHeadMetadata } from '../../utils/SSRUtils'
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

export const metadata = getHeadMetadata('Premium', 'See available premium options to support this project')
