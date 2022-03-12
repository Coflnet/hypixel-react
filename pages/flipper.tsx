import React, { useEffect } from 'react'
import FlipperComponent from '../components/Flipper/Flipper'
import { Container } from 'react-bootstrap'
import Search from '../components/Search/Search'
import { isClientSideRendering } from '../utils/SSRUtils'
import Head from 'next/head'
import { parseFlipAuction } from '../utils/Parser/APIResponseParser'
import { initAPI } from '../api/ApiHelper'

interface Props {
    flips?: any[]
}

function Flipper(props: Props) {
    return (
        <div className="page">
            <Head>
                <title>Auction flipper for hypixel skyblock</title>
            </Head>
            <Container>
                <Search />
                <h2>Item-Flipper (WIP)</h2>
                <hr />
                <FlipperComponent flips={props.flips?.map(parseFlipAuction)} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async () => {
    let api = initAPI(true)
    let flips = await api.getPreloadFlips()
    return {
        props: {
            flips: flips
        }
    }
}

export default Flipper
