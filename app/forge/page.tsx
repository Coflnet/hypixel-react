import { Container } from 'react-bootstrap'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import NavBar from '../../components/NavBar/NavBar'
import ForgeFlips from '../../components/ForgeFlips'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { getQueryClient } from '../../utils/QueryUtils'
import { getApiFlipForge, getGetApiFlipForgeQueryKey } from '../../api/_generated/skyApi'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'

export default async function Page() {
    const queryClient = getQueryClient()
    await queryClient.prefetchQuery({
        queryKey: [getGetApiFlipForgeQueryKey()],
        queryFn: () => getApiFlipForge()
    })

    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Forge Flips
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <ForgeFlips />
                </HydrationBoundary>
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    'Forge Flips',
    'Profit from Hypixel SkyBlock forge crafts with live profit per hour, costs, and Heart of the Mountain requirements.',
    undefined,
    ['forge flips', 'hypixel', 'skyblock', 'dwarven mines', 'hotm', 'profit'],
    undefined,
    getCanonicalUrl('/forge')
)

export const revalidate = 0
