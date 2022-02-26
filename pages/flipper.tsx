import React, { useEffect } from 'react'
import FlipperComponent from '../components/Flipper/Flipper'
import { Container } from 'react-bootstrap'
import Search from '../components/Search/Search'
import { isClientSideRendering } from '../utils/SSRUtils'
import Head from 'next/head'

function Flipper() {
    return (
        <div className="flipper">
            <Head>
                <title>Auction flipper for hypixel skyblock</title>
            </Head>
            <Container>
                <Search />
                <h2>Item-Flipper (WIP)</h2>
                <hr />
                <FlipperComponent />
            </Container>
        </div>
    )
}

export default Flipper
