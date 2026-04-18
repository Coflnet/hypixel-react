import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import { KatFlips } from '../../components/KatFlips/KatFlips'
import Search from '../../components/Search/Search'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.kat

export default async function Page() {
    let api = initAPI(true)
    let flips = await api.getKatFlips()
    return (
        <>
            <Container>
                <Search />
                <h1>Kat Flips</h1>
                <hr />
                <KatFlips flips={flips} />
                <ToolLandingSeo content={seoContent} />
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    seoContent.metadataTitle,
    seoContent.metadataDescription,
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/kat')
)

export const revalidate = 0
