import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { PremiumBazaarFlips } from '../../components/PremiumBazaarFlips/PremiumBazaarFlips'

const PAGE_TITLE = 'Premium Bazaar Flips — Real-time Bazaar Demand & Profit Finder | SkyCofl'
const PAGE_DESCRIPTION =
    'Premium Bazaar Flips — real-time Hypixel SkyBlock bazaar demand analysis and order-book flips. Get accurate, live profit estimates, buy/sell guidance and volume forecasts using our premium market tracker (premium required).'

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
                <h1>
                    <NavBar />
                    Premium Bazaar Flips
                </h1>
                <hr />

                <p className="lead">
                    Real-time Hypixel SkyBlock bazaar flips powered by live order-book demand and trade velocity analysis. These premium flips provide
                    more accurate profit estimates, suggested buy and sell actions, and volume forecasts compared to traditional weekly-average bazaar
                    spread listings.
                </p>

                <section aria-labelledby="premium-bazaar-features">
                    <h2 id="premium-bazaar-features">Why use Premium Bazaar Flips?</h2>
                    <ul>
                        <li>Live demand analysis and order-book depth for accurate profit calculations</li>
                        <li>Faster reaction to market changes and event-driven spikes</li>
                        <li>Better volume and turnover predictions to size buy orders safely</li>
                        <li>Direct integration with in-game mod commands like <code>/cofl bazaar</code></li>
                    </ul>
                </section>

                <PremiumBazaarFlips />

                <details style={{ marginTop: '1rem' }}>
                    <summary>Frequently asked questions</summary>
                    <p>
                        <strong>Difference to regular bazaar flips:</strong> Regular flips are calculated using weekly averages and spreads. Premium flips
                        analyze the current market state (demand, orderbook) to produce instant profit estimates.
                    </p>
                    <p>
                        <strong>Access:</strong> Premium subscription and Google login are required to access the real-time data used by these flips.
                    </p>
                </details>

            </Container>
            <BottomBanner />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
            />
        </>
    )
}

export const metadata = getHeadMetadata(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    'https://sky.coflnet.com/logo192.png',
    [
        'premium bazaar',
        'bazaar flips',
        'real-time bazaar',
        'hypixel bazaar',
        'skyblock bazaar',
        'bazaar flipper',
        'bazaar profit',
        'demand flips',
        'live bazaar data'
    ],
    'Premium Bazaar Flips — Real-time Bazaar Demand & Profit Finder'
)
