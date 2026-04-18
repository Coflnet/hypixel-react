import { Container } from 'react-bootstrap'
import FlippingHub from '../../components/FlippingHub/FlippingHub'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import Search from '../../components/Search/Search'
import NavBar from '../../components/NavBar/NavBar'
import Link from 'next/link'

export default function FlippingHubPage() {
    return (
        <>
            <Container>
                <Search />

                <h1>Flipping Hub</h1>
                <p>
                    Explore every major Hypixel SkyBlock flipping method in one place. This hub groups the core SkyCofl trading tools by market type so you
                    can choose the right workflow for your capital, risk tolerance, and available playtime.
                </p>
                <p>
                    Some routes are fast and liquid, like Bazaar Flips. Others are slower but higher margin, like Auction House, Kat, Attribute, or niche
                    craft opportunities. The goal of this page is not only to list tools, but to help you understand when each type of flip is actually the
                    right move.
                </p>

                <h2>How to choose the right flipping method</h2>
                <ul>
                    <li>Use <Link href="/bazaar">Bazaar Flips</Link> or <Link href="/npc">NPC Flips</Link> when you want simple, repeatable profit with smaller bankrolls.</li>
                    <li>Use <Link href="/crafts">Craft Flips</Link>, <Link href="/bookFlips">Book Flips</Link>, or <Link href="/forge">Forge Flips</Link> when value comes from turning inputs into a more expensive output.</li>
                    <li>Use <Link href="/flipper">Item Flipper</Link>, <Link href="/attributeFlips">Attribute Flips</Link>, or <Link href="/kat">Kat Flips</Link> when you understand item quality and are comfortable with longer holds.</li>
                    <li>Use <Link href="/topMovers">Top Movers</Link>, <Link href="/lowSupply">Low Supply Items</Link>, and <Link href="/recentFlips">Recent Flips</Link> as research tools that improve timing and market validation.</li>
                </ul>

                <p>
                    Let us know if you are missing any strategy on our Discord and we will add it. For the best in-game workflow we also recommend using the{' '}
                    <Link href="/mod">SkyCofl mod</Link> so you can move between research and execution faster.
                </p>
                <FlippingHub />

                <h2 className="mt-4">The core metrics every flipper should compare</h2>
                <ul>
                    <li>Margin tells you whether the trade is worth doing after fees and undercuts.</li>
                    <li>Liquidity tells you whether you can exit the position before the market changes.</li>
                    <li>Capital efficiency tells you whether the same coins could earn more somewhere else.</li>
                    <li>Market context tells you whether the opportunity is stable, event-driven, or already fading.</li>
                </ul>

                <h2 className="mt-4">Next guides to open</h2>
                <ul>
                    <li><Link href="/guides/getting-started-with-flipping">Getting Started with Flipping</Link> for the beginner workflow.</li>
                    <li><Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link> to match flip type to bankroll size.</li>
                    <li><Link href="/guides/how-to-find-best-items-to-flip">How to Find Best Items to Flip</Link> for filtering logic that works across every market.</li>
                    <li><Link href="/guides/tracking-profits-automatically">Tracking Profits Automatically</Link> to measure what is actually working.</li>
                </ul>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Hypixel SkyBlock Flipping Hub | Bazaar, AH, Craft, Kat and More',
    'Compare every major Hypixel SkyBlock flipping strategy in one hub. Explore Bazaar, Auction House, craft, forge, NPC, Kat, attribute, and research tools, then jump into the right SkyCofl workflow.',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/flips')
)

export const revalidate = 0
