import { Container } from 'react-bootstrap'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import NavBar from '../../components/NavBar/NavBar'
import MayorFlips from '../../components/MayorFlips'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { getQueryClient } from '../../utils/QueryUtils'
import { getApiFlipMayor, getGetApiFlipMayorQueryKey } from '../../api/_generated/skyApi'

export default async function Page() {
    const queryClient = getQueryClient()
    try {
        await queryClient.prefetchQuery({
            queryKey: [getGetApiFlipMayorQueryKey()],
            queryFn: () => getApiFlipMayor()
        })
    } catch (e) {
        // If the endpoint requires authentication and we don't have a server-side
        // token, prefetch can fail with 401/403. Don't block rendering — the
        // client will re-fetch with the user's token when available.
        console.warn('Prefetching mayor flips failed (likely unauthenticated):', e)
    }

    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Mayor Flips
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <MayorFlips />
                </HydrationBoundary>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Mayor Flips - Hypixel SkyBlock',
    'Maximize profits with Hypixel SkyBlock mayor flips! Discover items predicted to change value when the next mayor is elected. Our analysis uses historic price data from previous mayor terms to estimate upcoming price shifts and profit opportunities.',
    undefined,
    ['mayor flips', 'hypixel skyblock', 'skyblock flips', 'mayor election', 'derpy mayor', 'diana mayor', 'price prediction', 'skyblock profit', 'hypixel flipping']
)

export const revalidate = 0
