import { Container } from 'react-bootstrap'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import NavBar from '../../components/NavBar/NavBar'
import ForgeFlips from '../../components/ForgeFlips'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { getQueryClient } from '../../utils/QueryUtils'
import { getGetApiFlipForgeQueryOptions } from '../../api/_generated/skyApi'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.forge

export default async function Page() {
    const queryClient = getQueryClient()
    await queryClient.prefetchQuery(getGetApiFlipForgeQueryOptions())

    return (
        <>
            <Container>
                <NavBar />
                <h1>Forge Flips</h1>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <ForgeFlips />
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
    ['forge flips', 'hypixel', 'skyblock', 'dwarven mines', 'hotm', 'profit'],
    undefined,
    getCanonicalUrl('/forge')
)

export const revalidate = 0
