import Head from 'next/head'
import React from 'react'
import { Container } from 'react-bootstrap'
import { CraftsList } from '../components/CraftsList/CraftsList'
import Search from '../components/Search/Search'

function Crafts() {
    return (
        <div className="page">
            <Head>
                <title>Crafts</title>
            </Head>
            <Container>
                <Search />
                <h2>
                    Profitable crafts
                </h2>
                <hr />
                <CraftsList />
            </Container>
        </div>
    )
}

export default Crafts
