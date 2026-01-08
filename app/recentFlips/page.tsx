import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import RecentFlipsDynamicWrapper from '../../components/RecentFlips/RecentFlipsDynamicWrapper'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Recent Flips
                </h2>
                <hr />
                <RecentFlipsDynamicWrapper />
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    'Recent Flips',
    'Discover profitable Hypixel SkyBlock bazaar flipping opportunities. Real-time flip analysis, buy/sell spreads, and insta-buy order data to maximize your coin profits.',
    undefined,
    ['bazaar', 'flips', 'hypixel', 'skyblock', 'flip', 'bazaar flips', 'bazaar flipper'],
    undefined,
    getCanonicalUrl('/recentFlips')
)
