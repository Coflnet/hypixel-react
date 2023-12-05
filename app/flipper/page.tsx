import Search from '../../components/Search/Search'
import { initAPI } from '../../api/ApiHelper'
import { getHeadMetadata } from '../../utils/SSRUtils'
import Flipper from '../../components/Flipper/Flipper'
import { Container } from 'react-bootstrap'

export default async function Page() {
    let api = initAPI(true)
    let flips: any[] = []
    try {
        flips = await api.getPreloadFlips()
    } catch (e) {
        console.log('ERROR: Error receiving preFlips')
        console.log('------------------------\n')
    }

    return (
        <>
            <Container>
                <Search />
                <h2>Item Flipper</h2>
                <hr />
                <Flipper flips={flips} />
            </Container>
        </>
    )
}

export const revalidate = 0

export const metadata = getHeadMetadata(undefined, 'Free auction house item flipper for Hypixel Skyblock', undefined, ['flipper'])
