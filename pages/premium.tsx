import Head from 'next/head'
import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import Premium from '../components/Premium/Premium'
import { getHeadElement } from '../utils/SSRUtils'

function PremiumPage() {
    return (
        <div className="page">
            {getHeadElement('Premium', 'See available premium options to support this project')}
            <Container>
                <Premium />
            </Container>
        </div>
    )
}

export default PremiumPage
