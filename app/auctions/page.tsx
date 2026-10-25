import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import ActiveAuctionExplorer from '../../components/ActiveAuctionExplorer/ActiveAuctionExplorer'
import NavBar from '../../components/NavBar/NavBar'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.activeAuctions

export default async function Page() {
    initAPI(true)

    return (
        <>
            <Container>
                <NavBar />
                <h1>Active Auction Explorer</h1>
                <hr />
                <ActiveAuctionExplorer />
                <ToolLandingSeo content={seoContent} />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    seoContent.metadataTitle,
    seoContent.metadataDescription,
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/auctions')
)

export const revalidate = 0
