import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import AuthMod from '../../components/AuthMod/AuthMod'
import { Container } from 'react-bootstrap'
import { getGetApiFlipBazaarBooksQueryOptions } from '../../api/_generated/skyApi'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { BookFlips } from '../../components/BookFlips/BookFlips'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.bookFlips

export default async function Page() {
    const queryClient = getQueryClient()
    await queryClient.prefetchQuery(getGetApiFlipBazaarBooksQueryOptions())
    return (
        <>
            <Container>
                <NavBar />
                <h1>Book Flips (WIP)</h1>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <BookFlips />
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
    ['book', 'flips', 'hypixel', 'skyblock', 'book flips', 'enchantment', 'book combining', 'book flipper'],
    undefined,
    getCanonicalUrl('/bookFlips')
)
