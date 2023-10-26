import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import { CraftsList } from '../../components/CraftsList/CraftsList'
import Search from '../../components/Search/Search'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default async function Page() {
    let api = initAPI(true)
    let [crafts, bazaarTags] = await Promise.all([api.getProfitableCrafts(), api.getBazaarTags()])

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
