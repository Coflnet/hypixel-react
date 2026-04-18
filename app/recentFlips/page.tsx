import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import RecentFlipsDynamicWrapper from '../../components/RecentFlips/RecentFlipsDynamicWrapper'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.recentFlips

export default async function Page() {
    return (
        <>
            <Container>
                <NavBar />
                <h1>Recent Flips</h1>
                <hr />
                <RecentFlipsDynamicWrapper />
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
    ['bazaar', 'flips', 'hypixel', 'skyblock', 'flip', 'bazaar flips', 'bazaar flipper'],
    undefined,
    getCanonicalUrl('/recentFlips')
)
