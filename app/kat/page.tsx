import { initAPI } from '../../api/ApiHelper'
import { KatFlips } from '../../components/KatFlips/KatFlips'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import Search from '../../components/Search/Search'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default async function Page() {
    let api = initAPI(true)
    let flips = await api.getKatFlips()
    return (
        <>
            <RBContainer>
                <Search />
                <h2>Kat Flips</h2>
                <hr />
                <KatFlips flips={flips} />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Kat Flips', 'List of profitable upgrades from the NPC "Kat"')
