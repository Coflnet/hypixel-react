import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import StartpageComponent from '../components/Startpage/Startpage'
import Search from '../components/Search/Search'
import { initAPI } from '../api/ApiHelper'
import Head from 'next/head'

interface Props {
    newAuctions: Auction[]
    endedAuctions: Auction[]
    newPlayers: Player[]
    popularSearches: PopularSearch[]
    newItems: Item[]
}

const Startpage = (props: Props) => {
    return (
        <div className="page">
            <Head>
                <title>Auction house tracker for hypixel skyblock</title>
            </Head>
            <Container>
                <Search />
                <StartpageComponent
                    newAuctions={props.newAuctions}
                    endedAuctions={props.endedAuctions}
                    newItems={props.newItems}
                    newPlayers={props.newPlayers}
                    popularSearches={props.popularSearches}
                />
            </Container>
        </div>
    )
}

export const getServerSideProps = async () => {
    let api = initAPI(true)
    let results = await Promise.all([api.getNewAuctions(), api.getEndedAuctions(), api.getNewPlayers(), api.getPopularSearches(), api.getNewItems()])
    return {
        props: {
            newAuctions: results[0],
            endedAuctions: results[1],
            newPlayers: results[2],
            popularSearches: results[3],
            newItems: results[4]
        }
    }
}

export default Startpage
