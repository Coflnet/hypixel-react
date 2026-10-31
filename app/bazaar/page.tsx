import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import Link from 'next/link'
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
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: seoContent.faqs?.map(faq => ({
                        '@type': 'Question', name: faq.question,
                        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
                    }))
                }) }} />
                <h1>Bazaar Flips</h1>
                <p>Research notes updated <time dateTime="2026-10-29">29 October 2026</time>: results are opportunity estimates.
                    Weekly market volume does not guarantee your own fills. Limit order costs to your available budget and check net proceeds after tax.
                    {' '}<Link href="/guides/how-to-make-money-with-bazaar-flipping">Read the budget, tax and fill checklist</Link>.</p>
                <hr />
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
