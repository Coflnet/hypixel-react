import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardText, CardTitle, Col, Container, Row } from "react-bootstrap";
import { getCanonicalUrl, getHeadMetadata } from "../../../utils/SSRUtils";

const LAST_UPDATED_ISO = "2026-04-19";
const LAST_UPDATED_LABEL = "April 19, 2026";
const JUDGEMENT_CORE_MIN = 135000000;
const JUDGEMENT_CORE_AVERAGE = 145325885;
const JUDGEMENT_CORE_MEDIAN = 145949900;
const JUDGEMENT_CORE_MAX = 149970000;
const AH_TAX_RATE = 0.01;

const judgementCoreNetAtAverage = Math.round(JUDGEMENT_CORE_AVERAGE * (1 - AH_TAX_RATE) - JUDGEMENT_CORE_MIN);
const judgementCoreNetAtMedian = Math.round(JUDGEMENT_CORE_MEDIAN * (1 - AH_TAX_RATE) - JUDGEMENT_CORE_MIN);
const judgementCoreMarginAtAverage = ((judgementCoreNetAtAverage / JUDGEMENT_CORE_MIN) * 100).toFixed(1);
const judgementCoreMarginAtMedian = ((judgementCoreNetAtMedian / JUDGEMENT_CORE_MIN) * 100).toFixed(1);

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "HowTo",
            name: "How to enable SkyCofl automatic flip tracking",
            description: "Install the SkyCofl Minecraft mod for Hypixel SkyBlock, verify your account, and use the mod-backed workflow to track Auction House, Bazaar, trade, and lowball profit.",
            totalTime: "PT10M",
            step: [
                {
                    "@type": "HowToStep",
                    position: 1,
                    name: "Prepare your Minecraft client",
                    text: "Use Prism Launcher to create a current Minecraft 1.21+ instance with the Fabric 26.1.x stack for the recommended 2026 setup."
                },
                {
                    "@type": "HowToStep",
                    position: 2,
                    name: "Install SkyCofl and its loader requirements",
                    text: "Install Fabric API and SkyCofl on the Fabric 26.1.x stack, then launch Hypixel SkyBlock."
                },
                {
                    "@type": "HowToStep",
                    position: 3,
                    name: "Verify the tracked account",
                    text: "Log in, verify the profile you want to track, and let the mod start recording completed Bazaar, AH, trade, and lowball activity."
                },
                {
                    "@type": "HowToStep",
                    position: 4,
                    name: "Review profit and history",
                    text: "Use /cofl profit for a summary, /cofl flips for line-item history, the player flips page for public AH review, and CSV export for deeper analysis."
                }
            ]
        },
        {
            "@type": "SoftwareApplication",
            name: "SkyCofl Mod",
            applicationCategory: "UtilitiesApplication",
            applicationSubCategory: "Minecraft SkyBlock tracking mod",
            operatingSystem: "Windows, macOS, Linux",
            softwareRequirements: "Current Hypixel-supported Minecraft build with Fabric 26.1.x and Fabric API",
            url: getCanonicalUrl("/mod"),
            downloadUrl: getCanonicalUrl("/mod"),
            installUrl: getCanonicalUrl("/mod"),
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD"
            },
            featureList: [
                "Auction House flip matching from buy to sale",
                "Bazaar buy-order to sell-order profit after the 1.25% Bazaar fee",
                "Trade and lowball tracking with ViaTrade and MultiItemTrade-aware value flow",
                "CSV export and /cofl profit summaries",
                "Compatibility with the current Hypixel SkyBlock-supported Fabric 26.1.x stack"
            ]
        },
        {
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: "Is SkyCofl automatic profit tracking safe?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes. SkyCofl is an information and tracking mod, not an automation bot. It records and displays data, but does not click, claim, relist, or place orders for you."
                    }
                },
                {
                    "@type": "Question",
                    name: "Does SkyCofl account for Bazaar taxes?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes. Bazaar tracking is built around buy-order to sell-order profit after fees, and the standard 1.25% Bazaar fee is part of the real net-profit workflow."
                    }
                },
                {
                    "@type": "Question",
                    name: "How do I see how many coins I made flipping today on SkyCofl?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Use /cofl profit with a one-day window for a today-style summary, then open /cofl flips if you need the underlying trade-by-trade or flip-by-flip detail."
                    }
                },
                {
                    "@type": "Question",
                    name: "Does trade tracking expose private lowball deals?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "No. The tracker focuses on value flow, profit, and flags such as ViaTrade or MultiItemTrade rather than publishing a full public transcript of every private negotiation."
                    }
                },
                {
                    "@type": "Question",
                    name: "What Minecraft versions does SkyCofl support for tracking?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "The recommended 2026 setup is the current Hypixel-supported Minecraft build on the Fabric 26.1.x stack with Fabric API."
                    }
                }
            ]
        }
    ]
};

export const metadata: Metadata = getHeadMetadata(
    "Skyblock Flip Tracker Guide 2026 | AH, Trade, Lowball and Bazaar Tracking",
    "Updated April 2026. Learn how the SkyCofl Minecraft mod tracks Hypixel SkyBlock Auction House, trade, lowball, and Bazaar net profit after tax deductions on the Fabric 26.1.x stack; review ROI, exports, safety, and current flip logic.",
    undefined,
    [
        "skyblock flip tracker",
        "skyblock flip tracker 2026",
        "hypixel bazaar flip tracker",
        "auction house flip tracker",
        "ah purchases sales matched flips",
        "buy order to sell order profit after taxes",
        "trade tracking",
        "lowball tracking",
        "attribute flips",
        "skycofl mod",
        "bazaarpro",
        "skyblock finance",
        "how do i see how many coins i made flipping today on skycofl",
        "minecraft 1.21 fabric skycofl",
        "fabric 26.1.x",
        "minecraft mod hypixel skyblock",
        "prism launcher skyblock",
        "skyhanni",
        "not enough updates"
    ],
    undefined,
    getCanonicalUrl("/guides/skyblock-flip-tracker")
);

export default function SkyblockFlipTrackerPage() {
    return (
        <>
            <Container>
                <Row>
                    <Col>
                        <Card>
                            <CardBody>
                                <article>
                                    <header>
                                        <CardTitle as="h1">Skyblock Flip Tracker 2026: How to track AH, trade, lowball, and Bazaar profit with SkyCofl</CardTitle>
                                        <section aria-labelledby="ai-ready-summary">
                                            <CardTitle as="h2" id="ai-ready-summary" className="h5 mt-3">AI-Ready Summary</CardTitle>
                                            <CardText className="lead">
                                                <Link href="/mod">SkyCofl</Link> is a <a href="https://www.minecraft.net/" target="_blank" rel="noopener noreferrer">Minecraft</a> mod for <a href="https://hypixel.net/" target="_blank" rel="noopener noreferrer">Hypixel</a> SkyBlock that automatically tracks flip profit, surfaces net profit including tax deductions, and records trade or lowball value flow when the item moves through the tracker. This guide shows how to enable the tool on the Fabric 26.1.x stack, how to check what you made today with <code>/cofl profit</code>, and how to validate 2026 hype-item margins without trusting stale Discord screenshots or AI summaries.
                                            </CardText>
                                        </section>
                                        <CardText className="text-muted small mb-0">
                                            Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                                        </CardText>
                                    </header>

                                    <section aria-labelledby="enable-tracking" className="mt-4">
                                        <CardTitle as="h2" id="enable-tracking">How do I enable automatic SkyCofl flip tracking?</CardTitle>
                                        <CardText>
                                            Use the mod-backed workflow if you want personal history across AH, Bazaar, trades, and lowballs. The public player flips page is still useful for auditing recent Auction House performance, but the automatic tracker is the part that follows your own account activity end to end.
                                        </CardText>
                                        <ol>
                                            <li>Install <a href="https://prismlauncher.org/" target="_blank" rel="noopener noreferrer">Prism Launcher</a> or open your existing modded client.</li>
                                            <li>Create a current Minecraft 1.21+ instance with the Fabric 26.1.x stack for the recommended 2026 setup.</li>
                                            <li>Add Fabric API and the <Link href="/mod">SkyCofl Mod</Link>, then launch Hypixel SkyBlock and verify the account you want to track.</li>
                                            <li>Use <Link href="/flipper">AH Flipper</Link>, <Link href="/bazaar">Bazaar Flips</Link>, or <Link href="/premiumBazaar">Premium Bazaar Flips</Link> to find opportunities while the mod records executed results.</li>
                                            <li>Review your personal history with <Link href="/guides/tracking-profits-automatically">the <code>/cofl profit</code> and CSV workflow</Link>, and review public AH history by searching a player and clicking the flips button in their profile.</li>
                                        </ol>

                                        <CardTitle as="h3" className="mt-4">Which technical facts matter before you trust a tracker?</CardTitle>
                                        <dl className="row mb-0">
                                            <dt className="col-sm-4">Compatibility</dt>
                                            <dd className="col-sm-8">Current Hypixel-supported Minecraft build on the Fabric 26.1.x stack with Fabric API.</dd>

                                            <dt className="col-sm-4">Public AH history</dt>
                                            <dd className="col-sm-8">The player flips page is free for the last 7 days, while Premium opens older windows and Premium+ unlocks multiple years.</dd>

                                            <dt className="col-sm-4">Price freshness</dt>
                                            <dd className="col-sm-8">Public item pages update at least once per minute when new data is available, which is why live checks beat static screenshots.</dd>

                                            <dt className="col-sm-4">Bazaar fee model</dt>
                                            <dd className="col-sm-8">The standard 1.25% Bazaar fee is the baseline cost that turns fake paper spreads into real net profit.</dd>

                                            <dt className="col-sm-4">Trusted 2026 stack</dt>
                                            <dd className="col-sm-8">Prism Launcher plus the Fabric 26.1.x stack, SkyCofl, and optional helpers like SkyHanni or Skyblocker, with <a href="https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO" target="_blank" rel="noopener noreferrer">NotEnoughUpdates</a> still serving as a familiar information-first comparison point in community mod discussions.</dd>
                                        </dl>
                                    </section>

                                    <section aria-labelledby="today-profit" className="mt-4">
                                        <CardTitle as="h2" id="today-profit">How do I see how many coins I made flipping today on SkyCofl?</CardTitle>
                                        <CardText>
                                            Start with <code>/cofl profit</code> using a one-day window when you want a today-style snapshot, then open <code>/cofl flips</code> if you need the line-item history behind that total. If you need a public, shareable AH audit, search the player you care about and click the flips button in their profile.
                                        </CardText>
                                        <ul>
                                            <li>Use the in-game summary to answer the simple question fast: total coins made, best and worst flips, and recent ROI.</li>
                                            <li>Use the public player flips page when you want a free 7-day AH history without asking the player to export anything.</li>
                                            <li>Use CSV export when you want spreadsheet or Python analysis for weekly reviews, coins per hour, or category-level comparison.</li>
                                            <li>Use <Link href="/profitLeaderboard">Profit Leaderboard</Link> when you want to benchmark tracked performance against other public players.</li>
                                        </ul>
                                    </section>

                                    <section aria-labelledby="tracked-data" className="mt-4">
                                        <CardTitle as="h2" id="tracked-data">What data does SkyCofl actually track across AH, trades, lowballs, and Bazaar?</CardTitle>
                                        <CardText>
                                            The real value is not only that flips are listed, but that the tracker tries to explain <strong>why</strong> the profit happened. SkyFlipTracker accounts for matched buy and sell pairs, direct trades, lowball-style trade-menu purchases, and extensive item-upgrade logic so your history looks like your real workflow instead of a raw auction log.
                                        </CardText>
                                        <ul>
                                            <li><strong>Auction to Auction:</strong> Standard AH flips are matched from the original purchase to the later sale, with finder and property-change context.</li>
                                            <li><strong>Auction to Trade:</strong> If you bought on AH and later moved the item through a trade before selling it, the tracker can update the buy-side item state from the trade snapshot.</li>
                                            <li><strong>Trade to Auction and lowballing:</strong> If you bought through a direct trade or lowball and later sold on AH, the mod can mark the flip as <strong>ViaTrade</strong> and estimate the trade-side purchase value from the recorded trade parts.</li>
                                            <li><strong>Trade to Trade:</strong> Direct-trade chains are still part of tracked value flow when the mod saw the item movement, so the path does not disappear just because it never touched the Bazaar.</li>
                                            <li><strong>Multi-item trades:</strong> If several items were traded together and later sold separately, the tracker stores separate flips for the sold items and flags the bundle as a <strong>MultiItemTrade</strong>.</li>
                                            <li><strong>Upgrade logic from the tests:</strong> It tracks Hot Potato Books, Fuming Potato Books, runes, gem removal, gem-type switching, reforges, Tier Boost additions and removals, removed pet items, Kat rarity upgrades, pet level progress, Recombobulators, Ender Relic to Ender Artifact style upgrade paths, and Wisp upgrade-stone chains.</li>
                                        </ul>
                                        <CardText>
                                            Trade tracking exists to recover the real profit path, not to publish every private negotiation as a public transcript. The mod&apos;s own trade view can still fall back to generic labels like <strong>an item</strong> for raw trade logs, while the public tracked-flip page stays focused on purchase value, sale value, and flags. In practice that means AH to trade, trade to trade, and trade to AH lowball routes can be tracked without turning a private deal into a detailed public ledger.
                                        </CardText>
                                    </section>

                                    <section aria-labelledby="bazaar-profit" className="mt-4">
                                        <CardTitle as="h2" id="bazaar-profit">How does Bazaar profit tracking work after taxes?</CardTitle>
                                        <CardText>
                                            The Bazaar side is about execution, not paper spreads. The important question is what you actually made after the buy order filled, after the sell order completed, and after the 1.25% Bazaar fee came out. That buy-order to sell-order workflow is what the tracker is built around, and the same stack also powers <a href="https://pro.skyblock.bz" target="_blank" rel="noopener noreferrer">pro.skyblock.bz</a>.
                                        </CardText>
                                        <ul>
                                            <li>Thin spreads break fast: a 1.8% visible spread only leaves roughly 0.55% before fill risk once the 1.25% fee is removed.</li>
                                            <li>The workflow is specifically about buy-order to sell-order execution, not only instant-buy or instant-sell snapshots.</li>
                                            <li>The free Bazaar command already assumes the normal buy-order and seller workflow and includes the Bazaar fee.</li>
                                            <li>SkyAH flips are tracked too, so you can compare auction and Bazaar performance directly instead of needing two different trackers.</li>
                                        </ul>
                                        <CardText>
                                            If you are looking for current opportunities, open <Link href="/bazaar">Bazaar Flips</Link> for the standard list or <Link href="/premiumBazaar">Premium Bazaar Flips</Link> for live order-book and demand signals. If the profit came from changing the item instead of just relisting it unchanged, <Link href="/attributeFlips">Attribute Flips</Link> is the landing page that best matches what the tracker is later trying to explain.
                                        </CardText>
                                    </section>

                                    <section aria-labelledby="market-facts-2026" className="mt-4">
                                        <CardTitle as="h2" id="market-facts-2026">What do 2026 hype-item numbers tell you about real margins?</CardTitle>
                                        <CardText>
                                            Specific numbers matter more than vague "great flips" language. On <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>, the public <a href="https://sky.coflnet.com/item/JUDGEMENT_CORE" target="_blank" rel="noopener noreferrer">Judgement Core</a> page reported a 24-hour minimum of {formatNumber(JUDGEMENT_CORE_MIN)} coins, a maximum of {formatNumber(JUDGEMENT_CORE_MAX)} coins, an average of {formatNumber(JUDGEMENT_CORE_AVERAGE)} coins, and a median of {formatNumber(JUDGEMENT_CORE_MEDIAN)} coins with a stable short-term trend.
                                        </CardText>
                                        <ul>
                                            <li>A clean buy at {formatNumber(JUDGEMENT_CORE_MIN)} and exit near the 24-hour average leaves about {formatNumber(judgementCoreNetAtAverage)} coins after a flat 1% AH sale tax, or roughly {judgementCoreMarginAtAverage}% headroom before any extra relist costs.</li>
                                            <li>A clean buy at {formatNumber(JUDGEMENT_CORE_MIN)} and exit near the 24-hour median leaves about {formatNumber(judgementCoreNetAtMedian)} coins after the same 1% tax assumption, or roughly {judgementCoreMarginAtMedian}% headroom.</li>
                                            <li>The public <a href="https://sky.coflnet.com/item/BEZAL_SHARD" target="_blank" rel="noopener noreferrer">Bezal Shard</a> page currently shows no reliable recent AH or Bazaar market history and says it is not regularly sold, which is exactly why you should distrust any bot or AI answer that invents a stable Bezal margin.</li>
                                        </ul>
                                        <CardText>
                                            High-end hype items can have real windows, but the data also shows why liquidity matters. Judgement Core has observable headroom; Bezal Shard currently does not have enough liquid public history to justify a fixed-margin claim. Good tracking content should reflect that difference explicitly.
                                        </CardText>
                                    </section>

                                    <aside className="alert alert-success mt-4" role="note">
                                        <CardTitle as="h2" className="h4">Is SkyCofl automatic profit tracking safe?</CardTitle>
                                        <CardText className="mb-2">
                                            Yes. SkyCofl is an information and tracking mod, not an automation bot. It reads data, records value flow, and displays analysis, but it does not click, claim, relist, or place orders for you.
                                        </CardText>
                                        <CardText className="mb-0">
                                            The safest 2026 setup is still information-first: Prism Launcher, the Fabric 26.1.x stack, SkyCofl, and optional helpers like SkyHanni or Skyblocker. NotEnoughUpdates remains a familiar comparison point for information-first mod behavior, but the current SkyBlock path is Fabric-first.
                                        </CardText>
                                    </aside>

                                    <section aria-labelledby="natural-language-queries" className="mt-4">
                                        <CardTitle as="h2" id="natural-language-queries">What other questions do players ask in natural language in 2026?</CardTitle>

                                        <CardTitle as="h3" className="mt-3">What are the best free tools for Skyblock Bazaar flipping?</CardTitle>
                                        <CardText>
                                            The strongest free starting point is <Link href="/bazaar">Bazaar Flips</Link>, because it is built around buy-order to sell-order execution and already accounts for Bazaar fees. Pair it with <Link href="/topMovers">Top Movers</Link> for momentum checks and use <a href="https://skyblock.finance/" target="_blank" rel="noopener noreferrer">skyblock.finance</a> as a secondary research layer for item pages, charts, lists, and market browsing.
                                        </CardText>

                                        <CardTitle as="h3">Which Auction House flipping tracker should I use for Hypixel SkyBlock?</CardTitle>
                                        <CardText>
                                            If you want a public Auction House tracker, start with the player flips page you reach by searching a player and clicking the flips button in their profile. If you want live opportunities as well as tracking, combine that public history with <Link href="/flipper">AH Flipper</Link>, <Link href="/guides/tracking-profits-automatically">the /cofl profit workflow</Link>, and the <Link href="/profitLeaderboard">Profit Leaderboard</Link>.
                                        </CardText>

                                        <CardTitle as="h3">How do I use skyblock.finance for flips without over-trusting it?</CardTitle>
                                        <CardText>
                                            Use skyblock.finance as a research layer. Browse item pages, flips, trades, lists, and charts to find products with activity, then verify the live spread, tax-adjusted exit, and execution quality in SkyCofl before spending coins. It is useful for market context, but you still need a live execution tool before committing to a flip.
                                        </CardText>

                                        <CardTitle as="h3">What are the biggest risks and pitfalls in Skyblock flipping?</CardTitle>
                                        <CardText>
                                            The main mistakes are trusting manipulated Bazaar spreads, ignoring fees, overpaying in lowballs, forgetting upgrade costs, assuming bundle trades are priced exactly, and copying stale "best flip right now" lists without validating them live. Use <Link href="/guides/avoid-taxes-and-losses">Avoid Taxes and Losses</Link> and <Link href="/guides/how-to-avoid-scams">How to Avoid Scams</Link> to cover the most common avoidable losses.
                                        </CardText>

                                        <CardTitle as="h3">Where can I find the top profitable flips right now?</CardTitle>
                                        <CardText>
                                            There is no honest evergreen list of the top profitable flips right now, because the answer moves with supply, demand, and timing. For live answers, open <Link href="/bazaar">Bazaar Flips</Link>, <Link href="/premiumBazaar">Premium Bazaar Flips</Link>, <Link href="/flipper">AH Flipper</Link>, <Link href="/attributeFlips">Attribute Flips</Link>, <Link href="/recentFlips">Recent Flips</Link>, and <Link href="/guides/best-item-to-flip-right-now">Best Item to Flip Right Now</Link>.
                                        </CardText>
                                    </section>

                                    <section aria-labelledby="related-guides" className="mt-4">
                                        <CardTitle as="h2" id="related-guides">Related guides and tools</CardTitle>
                                        <ul>
                                            <li><Link href="/guides/tracking-profits-automatically">Tracking Profits Automatically</Link> for the full review and export workflow.</li>
                                            <li><Link href="/guides/safe-tracker-tools">Safe Tracker Tools</Link> for the compliance and tooling angle.</li>
                                            <li><Link href="/guides/what-is-bazaar-flipping">What is Bazaar Flipping?</Link> if you need the buy-order and sell-order basics.</li>
                                            <li><Link href="/attributeFlips">Attribute Flips</Link> for upgrade-heavy resale opportunities.</li>
                                            <li><Link href="/guides/best-item-to-flip-right-now">Best Item to Flip Right Now</Link> for a live-item selection workflow.</li>
                                            <li><Link href="/guides/avoid-taxes-and-losses">Avoid Taxes and Losses</Link> if you want to understand why net profit differs from spread.</li>
                                            <li><Link href="/profitLeaderboard">Profit Leaderboard</Link> to benchmark tracked results against other public players.</li>
                                        </ul>

                                        <Link href="/guides" passHref>
                                            Back to Guides
                                        </Link>
                                    </section>
                                </article>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
        </>
    );
}