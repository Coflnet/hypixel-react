import Search from '../../components/Search/Search'
import { initAPI } from '../../api/ApiHelper'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import Flipper from '../../components/Flipper/Flipper'
import { Container } from 'react-bootstrap'
import Link from 'next/link'

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
                <h2>Item Flipper</h2>
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
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    undefined,
    'Free auction house item flipper for Hypixel Skyblock',
    undefined,
    ['flipper'],
    undefined,
    getCanonicalUrl('/flipper')
)
