import { Container } from 'react-bootstrap'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import NavBar from '../../components/NavBar/NavBar'
import MayorFlips from '../../components/MayorFlips'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { getQueryClient } from '../../utils/QueryUtils'
import { getApiFlipMayor, getGetApiFlipMayorQueryKey } from '../../api/_generated/skyApi'

export default async function Page() {
    const queryClient = getQueryClient()

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
    ['mayor flips', 'hypixel skyblock', 'skyblock flips', 'mayor election', 'derpy mayor', 'diana mayor', 'price prediction', 'skyblock profit', 'hypixel flipping'],
    undefined,
    getCanonicalUrl('/mayor')
)

export const revalidate = 0
