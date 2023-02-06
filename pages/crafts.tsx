import Head from 'next/head'
import React from 'react'
import { Container } from 'react-bootstrap'
import { initAPI } from '../api/ApiHelper'
import { CraftsList } from '../components/CraftsList/CraftsList'
import Search from '../components/Search/Search'
import { getCacheControlHeader } from '../utils/CacheUtils'
import { parseProfitableCraft } from '../utils/Parser/APIResponseParser'
import { getHeadElement } from '../utils/SSRUtils'

interface Props {
    crafts: any[]
    bazaarTags: string[]
}

function Crafts(props: Props) {
    return (
        <div className="page">
            {getHeadElement('Crafts', 'List of profitable craft flips based on current ah and bazaar prices')}
            <Container>
                <Search />
                <h2>Profitable Hypixel Skyblock Craft flips</h2>
                <hr />
                <CraftsList crafts={props.crafts?.map(parseProfitableCraft)} bazaarTags={props.bazaarTags} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ res }) => {
    res.setHeader('Cache-Control', getCacheControlHeader())

    let api = initAPI(true)
    let results = await Promise.all([api.getProfitableCrafts(), api.getBazaarTags()])
    return {
        props: {
            crafts: results[0],
            bazaarTags: results[1]
        }
    }
}

export default Crafts
