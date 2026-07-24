import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import { CraftsList } from '../../components/CraftsList/CraftsList'
import Search from '../../components/Search/Search'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.crafts

export default async function Page({ searchParams }: { searchParams: Promise<{ craft?: string | string[] }> }) {
    let api = initAPI(true)
    let [crafts, bazaarTags, params] = await Promise.all([api.getProfitableCrafts(), api.getBazaarTags(), searchParams])
    let openCraftTag = Array.isArray(params.craft) ? params.craft[0] : params.craft

    return (
        <>
            <Container>
                <Search />
                <h1>Profitable Hypixel Skyblock Craft Flips</h1>
                <hr />
                <CraftsList crafts={crafts} bazaarTags={bazaarTags} openCraftTag={openCraftTag} />
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
    getCanonicalUrl('/crafts')
)

export const revalidate = 0
