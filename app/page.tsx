import React from 'react'
import StartpageComponent from '../components/Startpage/Startpage'
import Search from '../components/Search/Search'
import { initAPI } from '../api/ApiHelper'
import { parseAuction, parseItem, parsePlayer, parsePopularSearch } from '../utils/Parser/APIResponseParser'
import { getHeadMetadata } from '../utils/SSRUtils'
import { Container } from 'react-bootstrap'

export default async function Page() {
    let api = initAPI(true)
    let results: any[] = []
    try {
        // Dont load ended Auctions, as this is a expensive computation and can take multiple seconds
        results = await Promise.all([api.getNewAuctions(), api.getNewPlayers(), api.getPopularSearches(), api.getNewItems()].map(p => p.catch(e => null)))
    } catch (e) {
        console.log('Startpage SSR: ' + JSON.stringify(e))
    }
    let data = {
        newAuctions: results[0] || [],
        newPlayers: results[1] || [],
        popularSearches: results[2] || [],
        newItems: (results[3] || []).filter(search => search.name != 'null')
    }

    return (
        <>
            <Container>
                <Search />
                <StartpageComponent
                    newAuctions={data.newAuctions?.map(parseAuction)}
                    newItems={data.newItems?.map(parseItem)}
                    newPlayers={data.newPlayers?.map(parsePlayer)}
                    popularSearches={data.popularSearches?.map(parsePopularSearch)}
                />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata()
