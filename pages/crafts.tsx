import Head from 'next/head'
import React from 'react'
import { Container } from 'react-bootstrap'
import { initAPI } from '../api/ApiHelper'
import { CraftsList } from '../components/CraftsList/CraftsList'
import Search from '../components/Search/Search'
import { parseProfitableCraft } from '../utils/Parser/APIResponseParser'
import { getHeadElement } from '../utils/SSRUtils'

interface Props {
    crafts: any[]
    bazaarTags: string[]
}

function Crafts(props: Props) {
    return (
        <div className="page">
            {getHeadElement('Crafts', 'List of profitable crafts based on current ah and bazaar prices')}
            <Container>
                <Search />
                <h2>Profitable crafts</h2>
                <hr />
                <CraftsList crafts={props.crafts?.map(parseProfitableCraft)} bazaarTags={props.bazaarTags} />
            </Container>
        </div>
    )
}

export const getStaticProps = async () => {
    let api = initAPI(true)
    let results = await Promise.all([api.getProfitableCrafts(), api.getBazaarTags()])
    return {
        props: {
            crafts: results[0],
            bazaarTags: results[1]
        },
        revalidate: 60
    }
}

export default Crafts
