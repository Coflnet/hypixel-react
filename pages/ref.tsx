import Head from 'next/head'
import { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import RefComponent from '../components/Ref/Ref'
import { getHeadElement } from '../utils/SSRUtils'

function Ref() {
    return (
        <div className="page">
            {getHeadElement('Referral', 'Our referral system allows you to get a reward for inviting others')}
            <Container>
                <RefComponent />
            </Container>
        </div>
    )
}

export default Ref
