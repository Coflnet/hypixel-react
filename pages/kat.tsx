import Head from 'next/head'
import React from 'react'
import { Container } from 'react-bootstrap'
import { initAPI } from '../api/ApiHelper'
import { KatFlips } from '../components/KatFlips/KatFlips'
import Search from '../components/Search/Search'
import { getCacheContolHeader } from '../utils/CacheUtils'
import { parseKatFlip, parseProfitableCraft } from '../utils/Parser/APIResponseParser'
import { getHeadElement } from '../utils/SSRUtils'

interface Props {
    flips: any[]
}

function Kat(props: Props) {
    return (
        <div className="page">
            {getHeadElement('Kat Flips', 'List of profitable upgrades from the NPC "Kat"')}
            <Container>
                <Search />
                <h2>Kat Flips</h2>
                <hr />
                <KatFlips flips={props.flips?.map(parseKatFlip)} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async res => {
    res.setHeader('Cache-Control', getCacheContolHeader())

    let api = initAPI(true)
    let katFlips = await api.getKatFlips()
    return {
        props: {
            flips: katFlips
        }
    }
}

export default Kat
