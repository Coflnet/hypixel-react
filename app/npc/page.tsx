import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getApiFlipNpc, getGetApiFlipNpcQueryKey } from '../../api/_generated/skyApi'
import { NpcFlips } from '../../components/NpcFlips/NpcFlips'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.npc

export default async function Page() {
    const queryClient = getQueryClient()
    queryClient.prefetchQuery({
        queryKey: [getGetApiFlipNpcQueryKey()],
        queryFn: () => getApiFlipNpc()
    })
    return (
        <>
            <Container>
                <NavBar />
                <h1>NPC Flips</h1>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <NpcFlips />
                </HydrationBoundary>
                <ToolLandingSeo content={seoContent} />
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(
    seoContent.metadataTitle,
    seoContent.metadataDescription,
    undefined,
    ['npc', 'flips', 'hypixel', 'skyblock', 'flip', 'npc flips', 'npc flipper'],
    undefined,
    getCanonicalUrl('/npc')
)
