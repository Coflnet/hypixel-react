import { Container } from 'react-bootstrap'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import NavBar from '../../components/NavBar/NavBar'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { getQueryClient } from '../../utils/QueryUtils'
import { ReverseNpcFlips } from '../../components/ReverseNpcFlips/ReverseNpcFlips'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.reverseNpc

export default async function Page() {
    const queryClient = getQueryClient()

    return (
        <>
            <Container>
                <NavBar />
                <h1>Reverse NPC Flips</h1>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <ReverseNpcFlips />
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
    ['reverse npc flips', 'npc profit', 'npc flip', 'hypixel skyblock profit', 'reverse flipping'],
    undefined,
    getCanonicalUrl('/reverseNpc')
)
