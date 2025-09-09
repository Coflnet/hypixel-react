import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { getApiFlipUnknown, getGetApiFlipUnknownQueryKey } from '../../api/_generated/skyApi'
import { BazaarFlips } from '../../components/BazaarFlips/BazaarFlips'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { RecentFlips } from '../../components/RecentFlips/RecentFlips'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Recent Flips
                </h2>
                <hr />
                <RecentFlips />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Recent Flips', 'Discover profitable Hypixel SkyBlock bazaar flipping opportunities. Real-time flip analysis, buy/sell spreads, and insta-buy order data to maximize your coin profits.', undefined, ['bazaar', 'flips', 'hypixel', 'skyblock', 'flip', 'bazaar flips', 'bazaar flipper'])