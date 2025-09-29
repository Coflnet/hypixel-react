import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import { CraftsList } from '../../components/CraftsList/CraftsList'
import Search from '../../components/Search/Search'
import { getHeadMetadata } from '../../utils/SSRUtils'

function isTestRunner(): boolean {
    const flag = process.env.TEST_RUNNER || process.env.NEXT_PUBLIC_TEST_RUNNER
    return typeof flag === 'string' && flag.toLowerCase() === 'true'
}

export default async function Page() {
    let crafts: any[]
    let bazaarTags: string[]

    if (isTestRunner()) {
        const { TEST_PROFITABLE_CRAFTS, TEST_BAZAAR_TAGS } = await import('./test-data')
        crafts = TEST_PROFITABLE_CRAFTS
        bazaarTags = TEST_BAZAAR_TAGS
    } else {
        let api = initAPI(true)
        ;[crafts, bazaarTags] = await Promise.all([api.getProfitableCrafts(), api.getBazaarTags()])
    }

    return (
        <>
            <Container>
                <Search />
                <h2>Profitable Hypixel Skyblock Craft Flips</h2>
                <hr />
                <CraftsList crafts={crafts} bazaarTags={bazaarTags} />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Crafts', 'List of profitable craft flips based on current ah and bazaar prices')

export const revalidate = 0
