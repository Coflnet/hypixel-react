import React from 'react'
import { Container } from 'react-bootstrap'
import StartpageComponent from '../components/Startpage/Startpage'
import Search from '../components/Search/Search'
import { initAPI } from '../api/ApiHelper'
import { parseAuction, parseItem, parsePlayer, parsePopularSearch } from '../utils/Parser/APIResponseParser'
import { getHeadElement } from '../utils/SSRUtils'

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
            {getHeadElement()}
            <Container>
                <Search />
                <StartpageComponent
                    newAuctions={props.newAuctions?.map(parseAuction)}
                    endedAuctions={props.endedAuctions?.map(parseAuction)}
                    newItems={props.newItems?.map(parseItem)}
                    newPlayers={props.newPlayers?.map(parsePlayer)}
                    popularSearches={props.popularSearches?.map(parsePopularSearch)}
                />
            </Container>
        </div>
    )
}

export const getStaticProps = async () => {
    let api = initAPI(true)
    // Dont load ended Auctions, as this is a expensive computation and can take multiple seconds
    let results = await Promise.all([api.getNewAuctions(), api.getNewPlayers(), api.getPopularSearches(), api.getNewItems()].map(p => p.catch(e => null)))
    return {
        props: {
            newAuctions: results[0],
            endedAuctions: [],
            newPlayers: results[1],
            popularSearches: results[2],
            newItems: results[3]
        },
        revalidate: 60
    }
}

export default Startpage
