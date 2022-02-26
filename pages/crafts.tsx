import Head from 'next/head'
import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { CraftsList } from '../components/CraftsList/CraftsList'
import NavBar from '../components/NavBar/NavBar'
import Search from '../components/Search/Search'

function Crafts() {
    return (
        <div className="crafts-page">
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
                <CraftsList />
            </Container>
        </div>
    )
}

export default Crafts
