import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import AuthMod from '../../components/AuthMod/AuthMod'
import { Container } from 'react-bootstrap'
import { getApiFlipBazaarBooks, getApiFlipBazaarSpread, getGetApiFlipBazaarBooksQueryKey, getGetApiFlipBazaarSpreadQueryKey, useGetApiFlipBazaarSpread } from '../../api/_generated/skyApi'
import { BazaarFlips } from '../../components/BazaarFlips/BazaarFlips'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { BookFlips } from '../../components/BookFlips/BookFlips'

export default async function Page() {
    const queryClient = getQueryClient()
    queryClient.prefetchQuery({
        queryKey: [getGetApiFlipBazaarBooksQueryKey()],
        queryFn: () => getApiFlipBazaarBooks(),
    })
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Book Flips
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <BookFlips />
                </HydrationBoundary>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Bazaar Flips', 'Discover profitable Hypixel SkyBlock bazaar flipping opportunities. Real-time flip analysis, buy/sell spreads, and insta-buy order data to maximize your coin profits.', undefined, ['bazaar', 'flips', 'hypixel', 'skyblock', 'flip', 'bazaar flips', 'bazaar flipper'])