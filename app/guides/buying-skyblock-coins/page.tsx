import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Buying Hypixel Skyblock Coins: Read This Before You Risk a Ban",
    "Buying Hypixel Skyblock coins is against the rules and far easier to detect than most macroing. Learn the ban risks, ToS implications, safer ways to earn coins fast, how to report sellers, and better alternatives like Premium-powered manual flipping."
);

export default function BuyingCoinsGuidePage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Buying Hypixel Skyblock Coins: Don’t Do It. Here’s Why (and What to Do Instead)</CardTitle>
                            <CardText>
                                Buying coins with real money violates Hypixel’s rules. It is <strong>far easier for Hypixel to detect than most macroing</strong> and will <strong>definitely get you banned</strong> or profile-wiped—often in delayed ban waves. Instead of risking your account, use safe, faster, and cheaper methods that our community already uses to earn <strong>millions to billions</strong> of coins legitimately.
                            </CardText>
                            <CardText>
                                If you came here looking for automation: read our sister article <Link href="/guides/automating-flips">Automating Flips: Tools, Risks, and Safe Alternatives</Link>. TL;DR: Full automation risks bans; the winning approach is <strong>Premium-assisted manual flipping</strong> with Coflnet.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Legal and ToS Implications</CardTitle>
                            <CardText>
                                <strong>No—buying coins is IRL trading</strong> (also commonly called Real World Trading or RWT) and violates Hypixel’s ToS. There are no “safe” sellers or approved marketplaces. Hypixel enforces IRL trading strictly because it destabilizes the economy and fuels account theft and botting.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">What Are the Ban Risks and Consequences of IRL Trading?</CardTitle>
                            <ul>
                                <li><strong>Permanent Ban or Profile Wipe:</strong> Loss of access to your account or a complete reset of items, coins, and progress.</li>
                                <li><strong>Delayed “Ban Waves”:</strong> You may not be banned instantly—Hypixel batches RWT bans to mask detection methods.</li>
                                <li><strong>Scams and Chargebacks:</strong> RWT “markets” are rife with fraud—lost money, stolen accounts, or malware.</li>
                                <li><strong>Collateral Damage:</strong> Coins traced from bot farms or hacked accounts implicate every recipient along the chain.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">How Hypixel Detects and Enforces IRL Trading Bans (Step-by-Step)</CardTitle>
                            <CardText>
                                Hypixel’s systems make RWT <strong>easy to spot</strong>, often easier than macroing:
                            </CardText>
                            <ol>
                                <li><strong>Imbalanced Transfers:</strong> Trading a junk item for millions is automatically suspicious and logged.</li>
                                <li><strong>Source Tracing:</strong> Coins from hacked accounts, bot farms, or prior RWT are traceable across transactions.</li>
                                <li><strong>Behavioral Signals:</strong> New or inactive profiles receiving huge amounts; repeated suspicious trades; sudden networth spikes.</li>
                                <li><strong>Ban Waves:</strong> Accounts are banned in delayed waves so sellers can’t reverse-engineer what exactly got them detected.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">“Where Can I Buy Cheap Coins?”</CardTitle>
                            <CardText>
                                Nowhere legitimate. We won’t list or compare marketplaces because <strong>every</strong> RWT coin sale breaks the rules and puts your account at risk. If you see price “comparisons,” treat them as scam bait.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">How to Spot Coin-Seller Scams (and Why to Avoid Them Anyway)</CardTitle>
                            <ul>
                                <li><strong>“100% Safe, No Ban” claims:</strong> False. RWT bans happen daily—often in waves.</li>
                                <li><strong>Too-cheap prices:</strong> Often stolen coins or pure fraud. Expect chargebacks, wipes, or no delivery.</li>
                                <li><strong>Login requests:</strong> No legitimate tool needs your Mojang/Microsoft password.</li>
                                <li><strong>Shady payments:</strong> Gift cards/crypto only? That’s a red flag.
                                </li>
                            </ul>
                            <CardText>
                                If you encounter sellers, <strong>report them</strong> to Hypixel (in-game report, forums, or support portal with evidence: IGN, timestamps, screenshots, transaction IDs). The community stays safer when these operations are shut down.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Safer Alternatives: Earn Big, Fast—Legit</CardTitle>
                            <CardText>
                                The fastest, safest path is <strong>Premium-assisted manual flipping</strong>. It’s cheaper than buying coins and scales into <strong>millions → billions</strong> over time. Coflnet has already helped users earn <strong>over 1 trillion coins</strong>, and <strong>80% of active flippers use our service</strong>.
                            </CardText>
                            <ul>
                                <li><strong>Bazaar Flipping (Beginner → Advanced):</strong> Start with <Link href="/bazaar">Bazaar Flips</Link>, then upgrade to <Link href="/premiumBazaar">Premium Bazaar</Link> for demand-spread flips. In-game, use <Link href="/wiki/docs/mod-commands#bazaarcommand-alias-bz">/cofl bazaar</Link>.</li>
                                <li><strong>AH Flipping (Intermediate):</strong> Use <Link href="/flipper">AH Flipper</Link> and <Link href="/wiki/docs/mod-commands#ahflipscommand">/cofl ahflips</Link> to find undervalued listings and relist for profit.</li>
                                <li><strong>Craft & Forge Flips:</strong> Check <Link href="/crafts">Craft Flips</Link> and the <Link href="/wiki/docs/mod-commands#forgecommand">/cofl forge</Link> command to turn ingredients into profit.</li>
                                <li><strong>Data-Driven Decisions:</strong> Track earnings with <Link href="/wiki/docs/mod-commands#profitcommand">/cofl profit</Link> and review history with <Link href="/wiki/docs/mod-commands#flipscommand">/cofl flips</Link>.</li>
                            </ul>
                            <CardText>
                                For a broader overview, see <Link href="/guides/money-making-methods">Best Money Making Methods</Link> and <Link href="/guides/largest-bazaar-margins">Largest Bazaar Margins</Link>. Automating? Read <Link href="/guides/automating-flips">why that’s risky</Link> and how to stay safe.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Best Daily Activities for Competitive Progress</CardTitle>
                            <ul>
                                <li><strong>Daily Flips:</strong> Spend 30–90 minutes rotating high-volume Bazaar items; reinvest continuously.</li>
                                <li>
                                    <strong>Garden/Farming:</strong> Keep one optimized crop for steady income; swap to Mayor-boosted crops. See <Link href="/guides/greenhouse-guide">Greenhouse Guide</Link> for plot setup, watering, and mutation mechanics.
                                </li>
                                <li><strong>Gemstone Mining:</strong> High-gear players can hit top coins/hour in Crystal Hollows.</li>
                                <li><strong>Slayer/Dungeons:</strong> Push profitable tiers; sell drops on AH when demand spikes.</li>
                                <li><strong>Events:</strong> Track <Link href="/mayor">Mayor</Link> perks; see market <Link href="/topMovers">Top Movers</Link> and use <Link href="/wiki/docs/mod-commands#mayorflipscommand">/cofl mayorflips</Link>.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Build a Simple Grind Schedule</CardTitle>
                            <CardText>
                                Split your playtime into 3 blocks: (1) <strong>Flips</strong> (setup and rotate orders), (2) <strong>Active Method</strong> (farming/mining/slayer), (3) <strong>Review</strong> (<Link href="/wiki/docs/mod-commands#profitcommand">/cofl profit</Link> and <Link href="/wiki/docs/mod-commands#flipscommand">/cofl flips</Link>). Adjust weekly based on which block shows the best coins/hour.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Teams, Guilds, and Shared Rewards</CardTitle>
                            <CardText>
                                Join an active guild or co-op focused on flipping/mining. Share market intel, split tasks (one farms, one flips), and rotate event coverage for maximum uptime. Use <Link href="/wiki/docs/mod-commands#chatcommand-c">/cofl chat</Link> to network and collaborate.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Trade Legally for Coin Gains</CardTitle>
                            <ul>
                                <li>Use the official trade menu; avoid off-menu “gifts” and imbalanced swaps.</li>
                                <li>Price-check on <Link href="/item">Item History</Link>; pay taxes where applicable (<Link href="/wiki/docs/mod-commands#ahtaxcommand-alias-t">/cofl ahtax</Link>).</li>
                                <li>Document big trades (screenshots) to defend against false reports.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">If You Were Banned for IRL Trading—What Now?</CardTitle>
                            <ol>
                                <li><strong>Appeal:</strong> Use the Hypixel appeal portal with precise evidence and timestamps. Note: <em>RWT appeals rarely succeed</em>.</li>
                                <li><strong>Hygiene:</strong> Secure your accounts (Microsoft/Mojang, Discord). Remove any automation or RWT tools.</li>
                                <li><strong>Start Clean:</strong> If unbanned, delete risky tools; stick to Coflnet’s compliant ecosystem. If not, consider a fresh start—and stay legit.</li>
                            </ol>

                            <hr />
                            <CardText>
                                <strong>Bottom line:</strong> Buying coins is a fast track to a ban. <strong>Premium-assisted manual flipping</strong> with Coflnet is safer, cheaper, and proven—our users have already earned <strong>1,000,000,000,000+</strong> coins, and <strong>80% of flippers</strong> rely on our tools. Get started with <Link href="/premiumBazaar">Premium Bazaar</Link>, <Link href="/bazaar">Bazaar Flips</Link>, and <Link href="/flipper">AH Flipper</Link>—then track your success with <Link href="/wiki/docs/mod-commands#profitcommand">/cofl profit</Link>.
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
