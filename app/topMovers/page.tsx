import { Container } from 'react-bootstrap'
import NavBar from '../../components/NavBar/NavBar'
import TopMovers from '../../components/TopMovers'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'

export default function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Top Movers
                </h2>
                <hr />
                <TopMovers />
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    'Top Movers',
    'See which Hypixel SkyBlock items moved the most in the last 24 hours and jump straight into the live market data.',
    undefined,
    ['skyblock', 'hypixel', 'price change', 'top movers', 'bazaar', 'auction house']
)

export const revalidate = 0
