import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import AuthMod from '../../components/AuthMod/AuthMod'
import { Container } from 'react-bootstrap'
import { getApiFlipBazaarBooks, getGetApiFlipBazaarBooksQueryKey } from '../../api/_generated/skyApi'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { BookFlips } from '../../components/BookFlips/BookFlips'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'

export default async function Page() {
    const queryClient = getQueryClient()
    queryClient.prefetchQuery({
        queryKey: [getGetApiFlipBazaarBooksQueryKey()],
        queryFn: () => getApiFlipBazaarBooks()
    })
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Book Flips (WIP)
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <BookFlips />
                </HydrationBoundary>
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    'Book Flips',
    'Discover profitable Hypixel SkyBlock book flipping opportunities. Analyze book combining and enchantment flips in real-time to maximize your coin profits.',
    undefined,
    ['book', 'flips', 'hypixel', 'skyblock', 'book flips', 'enchantment', 'book combining', 'book flipper']
)
