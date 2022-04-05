import React from 'react'
import { Container } from 'react-bootstrap'
import CoflCoinsPurchase from '../components/CoflCoins/CoflCoinsPurchase'
import NavBar from '../components/NavBar/NavBar'
import { getHeadElement } from '../utils/SSRUtils'

function Cancel() {
    return (
        <div className="page">
            {getHeadElement('CoflCoins')}
            <Container>
                <h2>
                    <NavBar />
                    CoflCoins
                </h2>
                <hr />
                <CoflCoinsPurchase />
            </Container>
        </div>
    )
}

export default Cancel
