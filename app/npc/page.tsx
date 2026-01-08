import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getApiFlipNpc, getGetApiFlipNpcQueryKey } from '../../api/_generated/skyApi'
import { NpcFlips } from '../../components/NpcFlips/NpcFlips'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'

export default async function Page() {
    const queryClient = getQueryClient()
    queryClient.prefetchQuery({
        queryKey: [getGetApiFlipNpcQueryKey()],
        queryFn: () => getApiFlipNpc()
    })
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    NPC Flips
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <NpcFlips />
                </HydrationBoundary>
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    'NPC Flips',
    'Discover profitable Hypixel SkyBlock NPC flipping opportunities. Buy from NPCs and sell on the Auction House or Bazaar for a profit.',
    undefined,
    ['npc', 'flips', 'hypixel', 'skyblock', 'flip', 'npc flips', 'npc flipper'],
    undefined,
    getCanonicalUrl('/npc')
)
