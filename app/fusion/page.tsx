import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getApiFlipFusion, getGetApiFlipFusionQueryKey } from '../../api/_generated/skyApi'
import { FusionFlips } from '../../components/FusionFlips/FusionFlips'

export default async function Page() {
    const queryClient = getQueryClient()
    queryClient.prefetchQuery({
        queryKey: [getGetApiFlipFusionQueryKey()],
        queryFn: () => getApiFlipFusion(),
    })
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Fusion Flips
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <FusionFlips />
                </HydrationBoundary>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Fusion Flips', 'Discover profitable Hypixel SkyBlock NPC flipping opportunities.', undefined, ['npc', 'flips', 'hypixel', 'skyblock', 'flip', 'npc flips', 'npc flipper'])
