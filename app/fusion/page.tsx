import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getGetApiFlipFusionQueryOptions } from '../../api/_generated/skyApi'
import { FusionFlips } from '../../components/FusionFlips/FusionFlips'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.fusion

export default async function Page() {
    const queryClient = getQueryClient()
    await queryClient.prefetchQuery(getGetApiFlipFusionQueryOptions())
    return (
        <>
            <Container>
                <NavBar />
                <h1>Fusion Flips</h1>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <FusionFlips />
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
    [
        'shards',
        'flips',
        'hypixel',
        'skyblock',
        'flip',
        'fusion',
        'shard flipper'
    ],
    undefined,
    getCanonicalUrl('/fusion')
)
