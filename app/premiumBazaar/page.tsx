import { Metadata } from 'next'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { PremiumBazaarFlips } from '../../components/PremiumBazaarFlips/PremiumBazaarFlips'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.premiumBazaar

export default async function Page() {
    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What are Premium Bazaar Flips?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Premium Bazaar Flips use real-time bazaar order-book and demand analysis to estimate profit per hour and turnover. They are more accurate during market fluctuations compared to weekly-average spread flips.'
                }
            },
            {
                '@type': 'Question',
                name: 'Why do I need premium?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Premium access funds our real-time tracking infrastructure and grants access to live demand data, which is required to compute these flips.'
                }
            },
            {
                '@type': 'Question',
                name: 'How do I use premium hypixel skyblock bazaar flips?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Log in with Google, navigate to the item in the list, place a competitive buy order and monitor fills. Use /cofl bazaar in-game for faster workflow.'
                }
            }
        ]
    }

    return (
        <>
            <Container>
                <NavBar />
                <h1>Premium Bazaar Flips</h1>
                <hr />

                <p className="lead">
                    Real-time Hypixel SkyBlock bazaar flips powered by live order-book demand and trade velocity analysis. These premium flips provide
                    more accurate profit estimates, suggested buy and sell actions, and volume forecasts compared to traditional weekly-average bazaar
                    spread listings.
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

export const metadata: Metadata = getHeadMetadata(
    seoContent.metadataTitle,
    seoContent.metadataDescription,
    'https://sky.coflnet.com/logo192.png',
    [
        'premium bazaar',
        'bazaar flips',
        'real-time bazaar',
        'hypixel bazaar',
        'bazaar profit',
        'buy orders',
        'sell orders',
        'marketplace'
    ],
    undefined,
    getCanonicalUrl('/premiumBazaar')
)
