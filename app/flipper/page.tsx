import { Metadata } from 'next'
import Search from '../../components/Search/Search'
import { initAPI } from '../../api/ApiHelper'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import Flipper from '../../components/Flipper/Flipper'
import { Container } from 'react-bootstrap'
import Link from 'next/link'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.flipper

export default async function Page() {
    let api = initAPI(true)
    let flips: any[] = []
    try {
        flips = await api.getPreloadFlips()
    } catch (e) {
        console.log('ERROR: Error receiving preFlips ')
        console.log('------------------------\n')
    }

    return (
        <>
            <Container>
                <Search />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <h1>Item Flipper</h1>
                    <div id="skycofl-ai-chat-launcher" />
                </div>
                <hr />
                <Flipper flips={flips} />
                <Link href="/bazaar" style={{ marginTop: '20px', display: 'inline-block' }}>
                    Go to Bazaar Flips
                </Link>
                <span style={{ marginLeft: '12px' }} />
                <Link href="/premiumBazaar" style={{ marginTop: '20px', display: 'inline-block' }}>
                    Premium Bazaar Flips (premium required)
                </Link>
                <span style={{ marginLeft: '12px' }} />
                <Link href="https://donut.coflnet.com" style={{ marginTop: '20px', display: 'inline-block' }}>
                    DonutSMP Flips
                </Link>
                <ToolLandingSeo content={seoContent} />
            </Container>
        </>
    )
}

export const metadata: Metadata = getHeadMetadata(
    seoContent.metadataTitle,
    seoContent.metadataDescription,
    undefined,
    ['flipper'],
    undefined,
    getCanonicalUrl('/flipper')
)
