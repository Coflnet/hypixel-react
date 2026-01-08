import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import { KatFlips } from '../../components/KatFlips/KatFlips'
import Search from '../../components/Search/Search'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'

export default async function Page() {
    let api = initAPI(true)
    let flips = await api.getKatFlips()
    return (
        <>
            <Container>
                <Search />
                <h2>Kat Flips</h2>
                <hr />
                <KatFlips flips={flips} />
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    'Kat Flips',
    'List of profitable upgrades from the NPC "Kat"',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/kat')
)

export const revalidate = 0
