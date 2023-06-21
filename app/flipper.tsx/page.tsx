import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import Search from '../../components/Search/Search'
import { initAPI } from '../../api/ApiHelper'
import { getHeadMetadata } from '../../utils/SSRUtils'
import Flipper from '../../components/Flipper/Flipper'

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
            <RBContainer>
                <Search />
                <h2>Item Flipper</h2>
                <hr />
                <Flipper flips={flips} />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata(undefined, 'Free auction house item flipper for Hypixel Skyblock', undefined, ['flipper'])
