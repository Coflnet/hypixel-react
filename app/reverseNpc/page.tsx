import { Container } from 'react-bootstrap'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import NavBar from '../../components/NavBar/NavBar'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { getQueryClient } from '../../utils/QueryUtils'
import { ReverseNpcFlips } from '../../components/ReverseNpcFlips/ReverseNpcFlips'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'

export default async function Page() {
    const queryClient = getQueryClient()

    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Reverse NPC Flips
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <ReverseNpcFlips />
                </HydrationBoundary>
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    'Reverse NPC Flips',
    'Find guaranteed profits by buying items below their vendor value and selling them back to NPCs. Track every Hypixel SkyBlock reverse NPC flip with live margins and profit data.',
    undefined,
    ['reverse npc flips', 'npc profit', 'npc flip', 'hypixel skyblock profit', 'reverse flipping']
)
