import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

const LAST_UPDATED_ISO = "2026-10-29";
const LAST_UPDATED_LABEL = "October 29, 2026";

export const metadata: Metadata = getHeadMetadata(
    "Hypixel SkyBlock Profit Tracker | Completed Auction Flips with SkyCofl",
    "Review completed Hypixel SkyBlock auction flips with /cofl profit and /cofl flips. Check purchases, sales, taxes and item costs separately from opportunity estimates.",
    undefined,
    [
        "skycofl profit",
        "hypixel skyblock profit tracking",
        "minecraft mod profit tracker",
        "fabric 26.1.x",
        "completed auction flips"
    ],
    undefined,
    getCanonicalUrl('/guides/tracking-profits-automatically')
);

const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{
        "@type": "Question",
        name: "What Hypixel SkyBlock profit tracker can automatically track my auction flips and show actual profit?",
        acceptedAnswer: { "@type": "Answer", text: "Use SkyCofl to find matched auction purchases and sales, then reconcile a completed trade before relying on the total. The command reference documents the profit summary and links to individual auctions." }
    }]
};

export default function TrackingProfitsAutomaticallyPage() {
    return (
        <Container>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <article>
                                <header>
                                    <CardTitle as="h1">Hypixel SkyBlock profit tracker: review completed auction flips</CardTitle>
                                    <CardText className="lead">
                                        <Link href="/mod">SkyCofl</Link> tracks completed auction flips. Use <code>/cofl profit</code> for a summary and <code>/cofl flips</code> to inspect the purchases and sales behind it. This is for players checking what they earned after trading; the <Link href="/flipper">flipper</Link> instead shows opportunities with estimated resale values. An unsold item has no realized sale profit.
                                    </CardText>
                                    <CardText className="text-muted small mb-0">
                                        Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                                    </CardText>
                                </header>

                                <section aria-labelledby="audit-trade" className="mt-4">
                                    <CardTitle as="h2" id="audit-trade">What Hypixel SkyBlock profit tracker can automatically track my auction flips and show actual profit?</CardTitle>
                                    <CardText>Use SkyCofl to find matched auction purchases and sales, then reconcile a completed trade before relying on the total. The <Link href="/wiki/mod-commands">command reference</Link> documents the profit summary and links to individual auctions.</CardText>
                                    <ol>
                                        <li>Install the mod and follow its account verification prompts.</li>
                                        <li>After a sale, run <code>/cofl profit 1</code> for the last day and <code>/cofl flips</code> for the underlying trades.</li>
                                        <li>Open both auction records. Check that the item, purchase amount and sale amount match your trade.</li>
                                        <li>Subtract purchase cost, auction fees and any upgrade costs from sale proceeds. Compare this result with the displayed profit and investigate missing costs.</li>
                                    </ol>
                                    <CardText>A quote or an unsold listing is not a completed-trade receipt. Keep the transaction times and cost breakdown when comparing results; a dashboard total alone does not prove every expense was captured.</CardText>
                                </section>

                                <section aria-labelledby="why-track" className="mt-4">
                                    <CardTitle as="h2" id="why-track">Why track at all if you already know what you flipped?</CardTitle>
                                    <ul>
                                        <li><strong>Identify winning items:</strong> Which flips consistently profit? Which lose? Data answers this.</li>
                                        <li><strong>Optimize capital allocation:</strong> Compare realized returns alongside risk and holding time.</li>
                                        <li><strong>Measure coins/hour:</strong> Bazaar flipping vs Auction House vs crafting, upgrading, or lowballing: which route actually pays most?</li>
                                        <li><strong>Spot market trends:</strong> Investigate changes in prices, costs and fill times when margins shrink.</li>
                                        <li><strong>Catch losing streaks early:</strong> Without tracking, you might flip an item losing money for days before noticing.</li>
                                    </ul>
                                    <CardText>
                                        Net profit depends on actual sale proceeds after tax, purchase costs and any additional expenses. A quoted spread does not establish that orders will fill.
                                    </CardText>
                                </section>

                                <section aria-labelledby="install-mod" className="mt-4">
                                    <CardTitle as="h2" id="install-mod">How do I install SkyCofl Mod for automatic profit tracking?</CardTitle>
                                    <ol>
                                        <li>Download SkyCofl from the official <Link href="/mod">mod setup page</Link> or its published release source.</li>
                                        <li>Install it into your Minecraft mods folder or use the guided <Link href="/mod">SkyCofl Mod setup page</Link>.</li>
                                        <li>Start Hypixel SkyBlock.</li>
                                        <li>Follow the verification prompts, then use the profit and flips commands to inspect your tracked auction trades.</li>
                                    </ol>
                                    <CardText>
                                        Check the underlying records before treating a summary as a complete account of your expenses.
                                    </CardText>
                                </section>

                                <section aria-labelledby="today-summary" className="mt-4">
                                    <CardTitle as="h2" id="today-summary">How do I see how many coins I made flipping today on SkyCofl?</CardTitle>
                                    <CardText>
                                        <code>/cofl profit [days]</code> defaults to 7 days, supports a one-day window for a today-style snapshot, and goes up to 14 days on free tier or up to 180 days with Premium+.
                                    </CardText>
                                    <CardText>
                                        <strong>Use this first:</strong> if you want the fast answer, run the command with a one-day window. If you want the receipts behind the total, follow up with <code>/cofl flips</code> and record their costs.
                                    </CardText>
                                    <CardText>The command reference lists total profit, spend volume, average margin and best/worst flips with links. Review those links to understand the result.</CardText>
                                </section>

                                <section aria-labelledby="export-data" className="mt-4">
                                    <CardTitle as="h2" id="export-data">What should I keep in a spreadsheet?</CardTitle>
                                    <CardText>Record the item, purchase and sale auction links, transaction times, amounts paid and received, taxes and upgrade expenses. Keep unsold inventory separate from completed trades. These are suggested audit columns, not a promised export format.</CardText>
                                    <CardText>Compare net profit and holding time by item. A larger total can reflect more capital or longer playtime rather than a better strategy.</CardText>
                                </section>

                                <section aria-labelledby="review-workflow" className="mt-4">
                                    <CardTitle as="h2" id="review-workflow">How should you review profit data after it is tracked?</CardTitle>

                                    <CardTitle as="h3">How do you run a daily or weekly review cycle?</CardTitle>
                                    <CardText>
                                        <strong>Every 3–7 days:</strong> run <code>/cofl profit</code>, screenshot or export the result, and compare it against your last checkpoint.
                                        <br />
                                        <strong>Questions to answer:</strong>
                                    </CardText>
                                    <ul>
                                        <li>What is my average realized margin, and which costs are included?</li>
                                        <li>Am I flipping faster or slower? Fewer fills can mean tighter spreads or a saturated market.</li>
                                        <li>Which items tie up capital longest or contribute the largest losses?</li>
                                        <li>Is coins/hour trending up or down? Check whether changes in costs, playtime or unsold stock explain the difference.</li>
                                    </ul>

                                    <CardTitle as="h3">How do you A/B test items with real data?</CardTitle>
                                    <CardText>
                                        <strong>Test:</strong> Flip item A for two days and item B for two days, then compare margin percentage, fill speed, coins per hour, and consistency.
                                    </CardText>
                                    <CardText>
                                        <strong>Use your records:</strong> Filter by item, calculate the stats, and give more capital to the winner next week.
                                    </CardText>

                                    <CardTitle as="h3">How do you track seasonal or mayor-driven changes?</CardTitle>
                                    <CardText>
                                        <strong>Track:</strong> Profit before and after a mayor change, update, or event.
                                    </CardText>
                                    <ul>
                                        <li>Mayor perk changes can shift margins overnight.</li>
                                        <li>New item releases create both winners and unstable traps.</li>
                                        <li>Event demand spikes reward players who compare pre-event and mid-event data instead of relying on memory.</li>
                                    </ul>
                                </section>

                                <section aria-labelledby="key-metrics" className="mt-4">
                                    <CardTitle as="h2" id="key-metrics">Which metrics should I compare?</CardTitle>
                                    <ul>
                                        <li>Coins per hour: realized net profit divided by recorded playtime. Keep the time window consistent.</li>
                                        <li>Return on cost: net profit divided by purchase cost. Compare it alongside holding time and unsold inventory.</li>
                                        <li>Win rate: profitable completed trades divided by all completed trades. Include losses and check their size; win rate alone does not establish profitability.</li>
                                    </ul>
                                </section>

                                <section aria-labelledby="mistakes" className="mt-4">
                                    <CardTitle as="h2" id="mistakes">What tracking mistakes reduce real profit?</CardTitle>
                                    <ul>
                                        <li><strong>Not accounting for fees:</strong> Gross margin is not net profit. Account for the applicable Bazaar sales tax or your Auction House sale costs.</li>
                                        <li><strong>Mixing apples and oranges:</strong> Track Bazaar and AH separately first. Do not optimize a combined portfolio until you understand each route.</li>
                                        <li><strong>Ignoring outliers:</strong> One huge flip does not prove the whole strategy works. Watch medians and consistency, not only the mean.</li>
                                        <li><strong>Not tracking playtime:</strong> Coins/hour is meaningless without accurate time data. Use the mod&apos;s time tools if needed.</li>
                                    </ul>
                                </section>

                                <section aria-labelledby="tracking-faq" className="mt-4">
                                    <CardTitle as="h2" id="tracking-faq">Which tracking questions come up most often?</CardTitle>
                                    <CardTitle as="h3">Is tracking playtime important?</CardTitle>
                                    <CardText>
                                        <strong>Critical.</strong> You could make 1M in 30 minutes or in 30 hours. Same profit, completely different ROI.
                                    </CardText>

                                    <CardTitle as="h3">How far back should I track?</CardTitle>
                                    <CardText>
                                        <strong>7–30 days minimum.</strong> One or two days is mostly noise, while 30 days gives you a real baseline. Seasonal events often justify 60+ days.
                                    </CardText>

                                    <CardTitle as="h3">Should I track every flip?</CardTitle>
                                    <CardText>
                                        <strong>Yes.</strong> Flip-level granularity is what reveals which items drag ROI. If you track manually, at least capture every day, but automatic tracking is far more reliable.
                                    </CardText>
                                </section>

                                <section aria-labelledby="related-guides" className="mt-4">
                                    <CardTitle as="h2" id="related-guides">Related guides and tools</CardTitle>
                                    <ul>
                                        <li><Link href="/guides/skyblock-flip-tracker">Skyblock Flip Tracker</Link> — public player flips, trade and lowball tracking, and Bazaar profit review</li>
                                        <li><Link href="/flips">Flipping Hub</Link> — list of all kinds of flipping tools</li>
                                        <li><Link href="/guides/how-to-flip">How to Flip</Link></li>
                                        <li><Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link></li>
                                        <li><Link href="/guides/how-to-find-best-items-to-flip">How to Find Best Items</Link></li>
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
    );
}
