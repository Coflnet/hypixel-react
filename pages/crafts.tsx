import Head from 'next/head'
import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { initAPI } from '../api/ApiHelper'
import { CraftsList } from '../components/CraftsList/CraftsList'
import NavBar from '../components/NavBar/NavBar'
import Search from '../components/Search/Search'
import { parseProfitableCraft } from '../utils/Parser/APIResponseParser'

interface Props {
    crafts: any[]
}

function Crafts(props: Props) {
    return (
        <div className="page">
            <Head>
                <title>Crafts</title>
            </Head>
            <Container>
                <Search />
                <h2>
                    <NavBar />
                    Profitable crafts
                </h2>
                <hr />
                <CraftsList crafts={props.crafts?.map(parseProfitableCraft)} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async () => {
    let api = initAPI(true)
    let crafts = await api.getProfitableCrafts()
    return {
        props: {
            crafts: crafts
        }
    }
}

export default Crafts
