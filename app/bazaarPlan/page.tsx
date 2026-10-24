import { Metadata } from 'next'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { PremiumBazaarFlips } from '../../components/PremiumBazaarFlips/PremiumBazaarFlips'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.bazaarPlan

export default async function Page() {
    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is the Bazaar Plan?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The Bazaar Plan builds bazaar orders for your own budget, open orders and free slots from the live order book: quick Active flips, Investing orders held for up to 48 hours, or both, with entry and exit prices and the net profit after tax.'
                }
            },
            {
                '@type': 'Question',
                name: 'What do free accounts get?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Free accounts see a sample of three orders from their plan plus the number of hidden orders. Starter Premium unlocks the complete ranked plan.'
                }
            },
            {
                '@type': 'Question',
                name: 'How do I use the Bazaar Plan?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Log in with Google and verify your Minecraft account with our mod, choose Active, Investing or Both, then press Track in game on an order and follow the steps in Skyblock.'
                }
            }
        ]
    }

    return (
        <>
            <Container>
                <NavBar />
                <h1>Bazaar Plan (Active / Investing)</h1>
                <hr />

                <p className="lead">
                    Your personal Hypixel SkyBlock bazaar plan: orders sized for your budget, open orders and free order slots, built from the live order book. Choose quick Active flips, longer Investing orders or both, and see entry and exit prices, net profit after tax and an honest confidence badge for every order.
                </p>

                <PremiumBazaarFlips />
                <ToolLandingSeo content={seoContent} />

            </Container>
            <BottomBanner />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
            />
        </>
    )
}

const headMetadata: Metadata = getHeadMetadata(
    seoContent.metadataTitle,
    seoContent.metadataDescription,
    'https://sky.coflnet.com/logo192.png',
    [
        'bazaar plan',
        'bazaar investing',
        'bazaar flips',
        'real-time bazaar',
        'hypixel bazaar',
        'bazaar profit',
        'buy orders',
        'sell orders',
        'marketplace'
    ],
    undefined,
    getCanonicalUrl('/bazaarPlan')
)

// Unlisted until the plan has been tested manually: reachable by its direct link only, not indexed.
export const metadata: Metadata = { ...headMetadata, robots: { index: false, follow: false } }
