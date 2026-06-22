import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Flip Items in Hypixel SkyBlock | Bazaar and Auction House Guide",
    "Learn how to flip items in Hypixel SkyBlock with a step-by-step Bazaar and Auction House flipping guide. Find profitable items, calculate fees, avoid risky flips, and use live tools to improve profit per flip."
    ,
    undefined,
    getCanonicalUrl('/guides/how-to-flip')
);

export default function HowToFlipPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">How to Flip Items in Hypixel SkyBlock</CardTitle>
                            <CardText>
                                This Hypixel SkyBlock flipping guide covers the two main markets: Bazaar flipping for fast, high-volume buy-order trades and Auction House flipping for slower, higher-margin item deals. Flipping works by buying below market value, accounting for fees, and relisting where real buyers already exist. Use <Link href="/bazaar">Bazaar Flips</Link> to find high-volume, low-risk items for your first 10 flips.
                            </CardText>

                            <CardTitle as="h2" className="mt-3">Step-by-step: Bazaar flipping</CardTitle>
                            <CardText>
                                The Bazaar is commodity-based (identical stacks of items) and best for beginners. You'll complete your first flip in 30–90 minutes.
                            </CardText>
                            <ol>
                                <li>
                                    <strong>Pick an item:</strong> Open <Link href="/bazaar">Bazaar Flips</Link>, sort by "Volume ⇩", and choose an item with 10k+ volume/day and 3%+ margin. Example: Enchanted Sugar Cane, Wheat, or Bone.
                                </li>
                                <li>
                                    <strong>Place a buy order:</strong> In-game, open Bazaar → select your item → "Create Buy Order." Set your price 1–5% below instant-buy (just above the top buy order). Example: if instant-buy is 1,000 coins, place order at 970–990 coins.
                                </li>
                                <li>
                                    <strong>Wait for fills:</strong> Your order will fill as players instant-sell. Peak times (3–9pm EST) fill faster. Check back every 10–30 min or use SkyCofl mod for alerts (<strong>/cofl bazaar</strong>).
                                </li>
                                <li>
                                    <strong>Place a sell offer:</strong> Once filled, click "Create Sell Offer." Set price 1–5% above instant-sell (just below the top sell offer). Example: if instant-sell is 1,100 coins, offer at 1,130–1,150 coins.
                                </li>
                                <li>
                                    <strong>Collect profit:</strong> When your items sell, claim the coins from Bazaar. Net profit = (sell price × 0.9875) − buy price. The 0.9875 factor accounts for the 1.25% Bazaar fee (reducible to 1.125% by claiming orders manually).
                                </li>
                            </ol>

                            <CardTitle as="h3">Why use orders instead of instant trades?</CardTitle>
                            <CardText>
                                Instant-buy and instant-sell prices are set by the lowest seller and highest buyer. Using orders, you place yourself between these walls and capture the spread. Example:
                            </CardText>
                            <ul>
                                <li>Instant-buy: 1,000 coins (you pay sellers' price)</li>
                                <li>Top buy order: 950 coins (your competition)</li>
                                <li><strong>Your buy order: 970 coins</strong> (better than 950, cheaper than 1,000)</li>
                                <li>Top sell offer: 1,150 coins (your competition)</li>
                                <li><strong>Your sell offer: 1,130 coins</strong> (cheaper than 1,150, better than instant-sell)</li>
                                <li>Instant-sell: 1,100 coins (you accept buyers' low price)</li>
                            </ul>
                            <CardText>
                                Net: you buy at 970, sell at 1,130. Gross profit = 160 coins/item. Instant-trade profit = 100 coins/item (instant-sell − instant-buy). Orders give you 60% more profit.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Step-by-step: Auction House flipping</CardTitle>
                            <CardText>
                                The AH handles unique items (pets, reforged gear, enchanted books). Higher margins but slower turnover (12h–7d per flip).
                            </CardText>
                            <ol>
                                <li>
                                    <strong>Find undervalued auctions:</strong> Use <Link href="/flipper">AH Flipper</Link> to see items ending soon priced 10%+ below median value. Look for "BIN" (Buy It Now) auctions for instant purchases.
                                </li>
                                <li>
                                    <strong>Win the auction:</strong> For BIN, click and purchase immediately. For timed auctions, bid in the last 5 seconds ("sniping") to avoid bid wars.
                                </li>
                                <li>
                                    <strong>Relist at market price:</strong> Check recent sales for similar items (same pet level, reforge, enchants). List 2–5% below the lowest active listing to sell faster.
                                </li>
                                <li>
                                    <strong>Wait for sale:</strong> Popular items (meta pets, god rolls) sell in 12–48h. Niche items can take 3–7 days. Monitor and relist if unsold after 2 days.
                                </li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">Core principles for both markets</CardTitle>
                            <CardText>
                                The best items to flip are not always the items with the biggest visible spread. Strong flips usually combine enough margin, enough volume, predictable demand, and a clear exit price. Before buying, check whether similar items actually sell and whether the price has moved sharply in the last day.
                            </CardText>
                            <CardTitle as="h3">1. Volume beats margin (for beginners)</CardTitle>
                            <CardText>
                                A 3% margin on an item that flips 10 times/day earns more than a 50% margin on an item that sells once/week. High volume = faster compounding.
                            </CardText>

                            <CardTitle as="h3">2. Timing matters</CardTitle>
                            <CardText>
                                <strong>Bazaar:</strong> Peak activity 3–9pm EST (USA + EU overlap). Off-peak (2–8am EST) has lower volume but less competition.
                                <br />
                                <strong>AH:</strong> List items Thursday–Sunday for highest traffic. Avoid Monday mornings (low buyer activity).
                            </CardText>

                            <CardTitle as="h3">3. Account for fees and taxes</CardTitle>
                            <CardText>
                                <strong>Bazaar fee:</strong> 1.25% on sell offers (1.125% if you claim manually). Always calculate net profit: (sell price × 0.9875) − buy price.
                                <br />
                                <strong>AH tax:</strong> None on BIN purchases, but 1% listing fee on all auctions (refunded if item sells).
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Advanced tips</CardTitle>
                            <ul>
                                <li>
                                    <strong>Diversify across 5–10 items:</strong> Don't put all capital in one flip. Spread risk across multiple Bazaar items or AH categories (pets, armor, books).
                                </li>
                                <li>
                                    <strong>Use <Link href="/topMovers">Top Movers</Link></strong> to avoid volatile items. Skip items with 20%+ price swings in 24h (sign of manipulation or events).
                                </li>
                                <li>
                                    <strong>Track your flips:</strong> Use SkyCofl's history or a spreadsheet. If an item loses money 3 times in a row, blacklist it and find alternatives.
                                </li>
                                <li>
                                    <strong>Reinvest profits:</strong> Compound daily. Example: 1M capital → 1.05M (5% profit) → 1.1M next day. 30 days = 4.3M total (330% gain).
                                </li>
                                <li>
                                    <strong>Start with Bazaar, graduate to AH:</strong> Master Bazaar mechanics (orders, fees, volume) before tackling AH's unique item valuation.
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Frequently Asked Questions</CardTitle>
                            <CardTitle as="h3">How long does a Bazaar flip take?</CardTitle>
                            <CardText>
                                <strong>Fast items (high volume):</strong> 30–90 minutes total (10–30 min buy fill + 20–60 min sell fill).
                                <br />
                                <strong>Slower items:</strong> 2–6 hours during off-peak.
                                <br />
                                Use SkyCofl alerts to check fills without staying in-game.
                            </CardText>

                            <CardTitle as="h3">How long does an AH flip take?</CardTitle>
                            <CardText>
                                <strong>BIN sniping:</strong> Instant purchase, 12–48h to resell.
                                <br />
                                <strong>Auction sniping:</strong> Wait for auction end (up to 7d), then 24–72h to resell.
                                <br />
                                Total cycle: 1–10 days depending on item rarity.
                            </CardText>

                            <CardTitle as="h3">What if my Bazaar orders don't fill?</CardTitle>
                            <CardText>
                                <strong>Buy order not filling:</strong> Increase price 1–2% to match the buy wall. If still no fills after 2 hours, item may have low activity — cancel and pick a higher-volume item.
                                <br />
                                <strong>Sell offer not filling:</strong> Lower price 1–2% to undercut the sell wall. Check <Link href="/topMovers">Top Movers</Link> — if item crashed 10%+, instant-sell to cut losses.
                            </CardText>

                            <CardTitle as="h3">Should I flip Bazaar or AH first?</CardTitle>
                            <CardText>
                                <strong>Bazaar first.</strong> It's faster, more liquid, and easier to learn. AH requires deeper item knowledge (reforges, pet levels, enchant values) and longer holding periods.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides & tools</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — live profit estimates and volume data</li>
                                <li><Link href="/flipper">AH Flipper</Link> — undervalued auction finder</li>
                                <li><Link href="/topMovers">Top Movers</Link> — track price volatility</li>
                                <li><Link href="/guides/bazaar-vs-auction-house">Bazaar vs. Auction House</Link> — detailed comparison</li>
                                <li><Link href="/guides/getting-started-with-flipping">Getting Started with Flipping</Link></li>
                                <li><Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link></li>
                            </ul>

                            <CardTitle as="h3" className="mt-4">Real-World Flipping Concepts</CardTitle>
                            <CardText>
                                If you enjoy the mechanics of flipping in games like SkyBlock, you might be interested in applying these same principles to real life. <a href="https://ane.deals/flipper" target="_blank" rel="noopener noreferrer">Ane Deals Flipper</a> is an excellent resource for real-world flipping. While <strong>not</strong> a gaming tool, Ane Deals specializes in helping users identify profitable margins for physical items such as cars, couches, electronics, comic books, and vintage Pokemon cards. By understanding sell-through rates, competition analysis, and local market demand through Ane Deals, you can transition your digital auction house skills into practical, real-world profit.
                            </CardText>
                            <Link href="/guides" passHref>
                                Back to Guides
                            </Link>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
