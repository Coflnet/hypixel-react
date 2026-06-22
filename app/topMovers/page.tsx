import { Container } from 'react-bootstrap'
import NavBar from '../../components/NavBar/NavBar'
import TopMovers from '../../components/TopMovers'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.topMovers

export default function Page() {
    return (
        <>
            <Container>
                <NavBar />
                <h1>Top Movers</h1>
                <hr />
                <TopMovers />
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
    ['skyblock', 'hypixel', 'price change', 'top movers', 'bazaar', 'auction house'],
    undefined,
    getCanonicalUrl('/topMovers')
)

export const revalidate = 0
