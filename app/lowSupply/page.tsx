import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import LowSupply from '../../components/LowSupply/LowSupply'
import NavBar from '../../components/NavBar/NavBar'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.lowSupply

export default async function Page() {
    let api = initAPI(true)
    let lowSupplyItems = await api.getLowSupplyItems()

    return (
        <>
            <Container>
                <NavBar />
                <h1>Low Supply Items</h1>
                <hr />
                <LowSupply lowSupplyItems={lowSupplyItems} />
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
    getCanonicalUrl('/lowSupply')
)

export const revalidate = 0
