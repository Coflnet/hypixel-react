import Link from 'next/link'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { getGetApiFlipBazaarSpreadQueryOptions } from '../../api/_generated/skyApi'
import { BazaarFlips } from '../../components/BazaarFlips/BazaarFlips'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.bazaar

export default async function Page() {
    const queryClient = getQueryClient()
    await queryClient.prefetchQuery(getGetApiFlipBazaarSpreadQueryOptions())
    return (
        <>
            <Container>
                <NavBar />
                <h1>Bazaar Flips</h1>
                <hr />
                <p>
                    <Link href="/bazaarPlan" className="btn btn-primary" data-cy="personal-plan-link">
                        Personal plan: orders for your budget (Active / Investing)
                    </Link>
                </p>
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <BazaarFlips />
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
    ['bazaar', 'flips', 'hypixel', 'skyblock', 'flip', 'bazaar flips', 'bazaar flipper'],
    undefined,
    getCanonicalUrl('/bazaar')
)
