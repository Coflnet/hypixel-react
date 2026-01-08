import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Avoid Scams & Trading Fraud | Safety Guide & Red Flags",
    "Complete scam prevention guide: common fraud types, identification techniques, safe trading patterns, item value verification, reputation checking, and account security. Protect your coins & items in Hypixel Skyblock."
,
    undefined,
    getCanonicalUrl('/guides/how-to-avoid-scams')
);

export default function HowToAvoidScamsPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">How to Avoid Scams &amp; Trading Fraud</CardTitle>
                            <CardText>
                                Scamming is one of the biggest threats to your wealth in Hypixel Skyblock. Whether through market manipulation, fake items, account takeovers, or phishing, scammers use sophisticated tactics to steal coins and items. The good news: <strong>most scams are completely preventable if you know the warning signs.</strong> This comprehensive guide reveals every common scam type, how to identify them instantly, and the exact strategies that keep experienced traders safe.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">The 6 Most Common Scam Types</CardTitle>

                            <CardTitle as="h4">1. Market Manipulation (Item Price Inflation)</CardTitle>
                            <CardText>
                                <strong>How it works:</strong> Scammers artificially inflate prices by buying huge quantities of a low-volume item to create fake demand, then selling at inflated prices to unsuspecting traders. Classic example: A 1M Enchanted Book normally costs 500K, but suddenly jumps to 2M as scammers buy up all supply.
                            </CardText>
                            <CardText>
                                <strong>Red flags:</strong>
                                <ul>
                                    <li>Sudden price spikes (&gt;30% in 24 hours) on low-volume items</li>
                                    <li>Huge buy orders appearing overnight at above-market prices</li>
                                    <li>Item on /topMovers that shouldn't be trending (unknown/useless item)</li>
                                    <li>Spread between buy/sell prices is abnormally wide (normally 1-2%, suddenly 10%+)</li>
                                </ul>
                            </CardText>
                            <CardText>
                                <strong>Detection using our tools:</strong> Visit the <Link href="/bazaar">Bazaar</Link> page and check the spread %. If spread &gt; 5% on an item, it's likely being manipulated. Check <Link href="/topMovers">Top Movers</Link> – if an unfamiliar item suddenly ranks #1, it's manipulation. Look at the <strong>volume</strong> – if it's under 100K coins/day, avoid it.
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> Only flip items with &gt; 500K daily volume and spreads &lt; 2%. Use price history to identify manipulation – if a 3-month average is 500K but today it's 2M, someone's manipulating. When in doubt, wait 24 hours and recheck.
                            </CardText>

                            <CardTitle as="h4">2. Item Swapping / Fake Items (Auction House)</CardTitle>
                            <CardText>
                                <strong>How it works:</strong> Scammers list items that appear valuable at first glance but are actually worthless. They might use similar names, matching colors, or skins to trick you. Example: "Godlike Shadow Assassin Chestplate" (garbage) listed as "Godlike Crystalline Chestplate" (worth 50M).
                            </CardText>
                            <CardText>
                                <strong>Red flags:</strong>
                                <ul>
                                    <li>Item price is 50%+ below market rate for similar items</li>
                                    <li>Item has strange/suspicious lore text</li>
                                    <li>Seller is new account with no auction history</li>
                                    <li>Item name has subtle typos or strange spacing</li>
                                    <li>Stats don't match what you'd expect (Normal item with Legendary stats, etc.)</li>
                                </ul>
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> <strong>Always inspect item details before bidding.</strong> Check: Full name (exact spelling), lore text, rarity level, all stats, enchantments, dungeon level if applicable. Compare exact name to <Link href="/item">Item Database</Link> to verify it's a real item. If price seems "too good," screenshot the auction and verify on Discord with trusted traders.
                            </CardText>

                            <CardTitle as="h4">3. Discord/Account Verification Scams (Phishing)</CardTitle>
                            <CardText>
                                <strong>How it works:</strong> Scammers create fake Discord servers or impersonate mods, asking you to "verify" by entering your Minecraft username and email. They then use this info to reset your password and hijack your account. <strong>This is extremely common and causes account losses in the millions.</strong>
                            </CardText>
                            <CardText>
                                <strong>Red flags:</strong>
                                <ul>
                                    <li>Discord message asking you to verify on an "external link"</li>
                                    <li>Server requires you to enter Minecraft username to chat</li>
                                    <li>Link looks like Discord but URL is slightly wrong (discor.com instead of discord.com)</li>
                                    <li>"Moderator" asks for email/password via DM</li>
                                    <li>Unusual server invitation from unknown player</li>
                                    <li>A website asking for your Minecraft email login credentials</li>
                                </ul>
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> <strong>Never, ever enter your email/password on any website except minecraft.net and microsoft.com.</strong> Real Discord servers don't require external verification. Don't click links from players you don't know. If unsure, ask a trusted friend or mod. Enable 2FA on your Microsoft account immediately – this blocks 99% of account takeovers.
                            </CardText>

                            <CardTitle as="h4">4. Low-Volume Item Traps</CardTitle>
                            <CardText>
                                <strong>How it works:</strong> Scammers buy all supply of a niche item (like specific shards or rare enchanted materials), creating artificial scarcity. They buy at 1M, then list individual units at 5M each, knowing desperate players will pay. Later they dump thousands at 2M, crashing the price.
                            </CardText>
                            <CardText>
                                <strong>Red flags:</strong>
                                <ul>
                                    <li>Item has zero daily volume history</li>
                                    <li>Only 1-2 sellers offering the item</li>
                                    <li>Price wildly different from similar items (Certain shards at 100x their cost)</li>
                                    <li>Item appears on Top Movers despite low volume</li>
                                </ul>
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> <strong>Avoid flipping items with &lt; 100K daily volume.</strong> Check <Link href="/bazaar">Bazaar</Link> volume column – if it says "0" or shows &lt; 50 transactions/day, skip it. These items are death traps for flippers. Stick to established, high-volume items where price discovery is real.
                            </CardText>

                            <CardTitle as="h4">5. Account Security Breaches (Not a Scam, But Related)</CardTitle>
                            <CardText>
                                <strong>How it works:</strong> Your account gets hacked through weak password, phishing email, or compromised website login. Hackers sell your items or transfer coins to alt accounts.
                            </CardText>
                            <CardText>
                                <strong>Red flags:</strong>
                                <ul>
                                    <li>Login from new device/location you don't recognize</li>
                                    <li>Items suddenly missing from inventory</li>
                                    <li>Coins transferred to unknown players</li>
                                    <li>Email or password changed without your action</li>
                                    <li>Hypixel suspension notice for unauthorized trading</li>
                                </ul>
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> This is prevention + response:
                                <ul>
                                    <li><strong>NOW:</strong> Enable 2FA on Microsoft account (accounts.microsoft.com) – this is your first line of defense</li>
                                    <li><strong>NOW:</strong> Use unique, 16+ character password for Minecraft account (not reused anywhere)</li>
                                    <li><strong>NOW:</strong> Never use same password for Discord, email, gaming sites</li>
                                    <li>If hacked: Change password immediately, disable all connected devices, check payment methods on Microsoft account, contact Hypixel support with proof (screenshots, account recovery info)</li>
                                </ul>
                            </CardText>

                            <CardTitle as="h4">6. "Too Good To Be True" Direct Trades</CardTitle>
                            <CardText>
                                <strong>How it works:</strong> Player offers 100M for 50M coins, "fire sale" on rare items, or profitable flips that make no business sense. This is almost always a scam – they're testing if you'll accept, then they swap items at last second or their item is fake.
                            </CardText>
                            <CardText>
                                <strong>Red flags:</strong>
                                <ul>
                                    <li>Player wants to trade in private island (harder to witness scam)</li>
                                    <li>Offer is "just for you" (creates false urgency)</li>
                                    <li>Player claims they need coins "urgently" (emotional manipulation)</li>
                                    <li>Item is something you can't easily verify value of</li>
                                    <li>Player has low username or fresh account</li>
                                </ul>
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> Use Bazaar &amp; Auction House exclusively for trading. Only direct trade with people you know &amp; trust (guild members, Discord mods, IRL friends). If you must direct trade, use a middleman service from trusted community Discord.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">Your 8-Point Safe Trading Checklist</CardTitle>
                            <CardText>
                                Use this checklist <strong>every single time</strong> you execute a trade:
                            </CardText>
                            <Card className="bg-light p-3">
                                <CardText>
                                    <strong>✓ Verify Item Name</strong> – Write down exact spelling, check against <Link href="/item">Item Database</Link>, compare with similar listings<br/>
                                    <strong>✓ Check Rarity/Stats</strong> – Verify all enchantments, stats, dungeon levels match what you're paying for<br/>
                                    <strong>✓ Analyze Spread %</strong> – Visit <Link href="/bazaar">Bazaar</Link>, check spread is &lt; 2% (normal) or &gt; 5% (manipulation warning)<br/>
                                    <strong>✓ Review Volume</strong> – Item should have &gt; 500K daily volume. Zero volume = avoid entirely<br/>
                                    <strong>✓ Check Price History</strong> – Sudden spike = manipulation. Normal progression = safe<br/>
                                    <strong>✓ Verify Seller Reputation</strong> – For AH items, check seller's recent auctions (scammers have pattern of similar fraud)<br/>
                                    <strong>✓ Delay 24 Hours if Unsure</strong> – Sleep on big trades. If it's still a good deal tomorrow, it's probably real<br/>
                                    <strong>✓ Use Bazaar/AH Only</strong> – Never direct trade outside official systems. Ever.
                                </CardText>
                            </Card>

                            <CardTitle as="h3" className="mt-4">5 Scams Specifically Targeting Flippers</CardTitle>

                            <CardTitle as="h4">Scam #1: Flash Crash Buy Orders</CardTitle>
                            <CardText>
                                Scammers place huge buy orders at 50% of market price, causing panicked sellers to accept. Scammer cancels after getting a few sells, price bounces back. You sold at massive loss.
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> Check if buy order is from consistent buyer or one-time whale. Don't panic-sell if you see low offers.
                            </CardText>

                            <CardTitle as="h4">Scam #2: Premium Item Hype Trap</CardTitle>
                            <CardText>
                                Influencer or fake accounts hype an item ("This is next meta!"), driving price up. Scammer dumps thousands, price crashes 80%, retail flippers lose everything.
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> Never buy "trending" items the day they spike. Wait 3-7 days to see if trend is real.
                            </CardText>

                            <CardTitle as="h4">Scam #3: Bid Sniping with Fake Items</CardTitle>
                            <CardText>
                                You bid on item in AH (looks real), scammer wins auction, swaps a fake version, relists. By the time you realize it's fake, coins are gone.
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> Triple-check item details before bidding. Screenshot exact item, compare to <Link href="/item">Item Database</Link> if it's expensive.
                            </CardText>

                            <CardTitle as="h4">Scam #4: "Guaranteed Profit" Scheme</CardTitle>
                            <CardText>
                                Someone claims they'll give you 10M to flip for 50% profit (15M return). This is either a test for account access or laundering stolen coins. Don't participate.
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> Hypixel investigates accounts involved in laundering. Stay far away from "too good" offers.
                            </CardText>

                            <CardTitle as="h4">Scam #5: Buy Order Trap on Niche Items</CardTitle>
                            <CardText>
                                Scammer places 1000+ item buy order at market price, you accept, then they never claim it. Your coins are locked while they short-sell the item, crashing price.
                            </CardText>
                            <CardText>
                                <strong>Protection:</strong> Check buy order's purchase history. If it's from new account with zero history, be cautious. For niche items, wait for order to actually execute before celebrating.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">Market Manipulation Detection Guide</CardTitle>
                            <CardText>
                                Our tools are <strong>specifically designed to catch manipulation.</strong> Here's how to use them:
                            </CardText>
                            <Card className="bg-light p-3">
                                <CardText>
                                    <strong>Step 1: Visit <Link href="/bazaar">Bazaar</Link></strong> – Sort by Spread %. Any item &gt; 5% spread is suspicious<br/>
                                    <strong>Step 2: Check Volume Column</strong> – If &lt; 100K coins/day, avoid entirely. This is manipulation territory<br/>
                                    <strong>Step 3: Check <Link href="/topMovers">Top Movers</Link></strong> – See which items jumped. If it's niche/unknown item, manipulation is likely<br/>
                                    <strong>Step 4: Analyze 30-Day Trend</strong> – Price should trend gradually, not spike 200% overnight<br/>
                                    <strong>Step 5: Compare to <Link href="/crafts">Crafts</Link></strong> – If item's crafting profitability is unchanged but price jumped, manipulation happened<br/>
                                </CardText>
                            </Card>

                            <CardTitle as="h3" className="mt-4">Account Security: The Final Layer</CardTitle>
                            <CardText>
                                Even if you avoid all trading scams, a compromised account loses everything instantly. Secure your account now:
                            </CardText>
                            <Card className="bg-light p-3">
                                <CardText>
                                    <strong>Critical Actions (Do NOW):</strong><br/>
                                    1. Enable 2FA: accounts.microsoft.com → Security → Two-step verification<br/>
                                    2. Change password to unique 16+ characters (CAPITAL, lowercase, numbers, symbols)<br/>
                                    3. Check connected apps/devices and remove unknown ones<br/>
                                    4. Add recovery email and phone number to Microsoft account<br/>
                                    <br/>
                                    <strong>Ongoing Practices:</strong><br/>
                                    • Never click links from players in-game or Discord<br/>
                                    • Only visit minecraft.net, microsoft.com, and hypixel.net<br/>
                                    • Check email for suspicious login attempts (Microsoft sends alerts)<br/>
                                    • If you see login from new device, change password immediately<br/>
                                    • Use password manager (1Password, BitWarden, KeePass) for unique passwords everywhere<br/>
                                </CardText>
                            </Card>

                            <CardTitle as="h3" className="mt-4">FAQ: Scams &amp; Safety</CardTitle>
                            
                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: Is it safe to direct trade with guild members?</strong></CardText>
                                <CardText>A: Mostly yes – guild members have reputation to maintain. But always verify item details before accepting. Use /cofl profit to confirm fair price before trade.</CardText>
                            </Card>

                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: Someone sent me a link to "verify my account." What do I do?</strong></CardText>
                                <CardText>A: Delete it immediately. Real servers never require external verification. If you're concerned, leave the server and check with Discord mods on Hypixel's official server – the link is 100% a scam.</CardText>
                            </Card>

                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: How do I know if I'm being manipulated on price?</strong></CardText>
                                <CardText>A: Check the item's 30-day price average on <Link href="/bazaar">Bazaar</Link>. If today's price is &gt;2x the 30-day average and it's low-volume, manipulation is happening. Wait for price to stabilize.</CardText>
                            </Card>

                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: Can I get my coins back if I fall for a scam?</strong></CardText>
                                <CardText>A: Hypixel generally doesn't reverse trades (this would enable RWT laundering). However, for account compromises, contact support with proof. Document everything: screenshots, timestamps, account details.</CardText>
                            </Card>

                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: What's the #1 way to get my account hacked?</strong></CardText>
                                <CardText>A: Weak password + no 2FA. Hackers buy password lists from data breaches, try your email, gain instant access. 2FA blocks 99% of these attacks. Enable it now if you haven't.</CardText>
                            </Card>

                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: If an item's spread is 20%, is it always a scam?</strong></CardText>
                                <CardText>A: Not always – some rare items naturally have wide spreads. But for common Bazaar items, 20% spread is a huge red flag. Avoid items with spreads &gt; 5% unless they're known niche items.</CardText>
                            </Card>

                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: Can I use your tracking tools to detect manipulation?</strong></CardText>
                                <CardText>A: Yes! Use <Link href="/bazaar">Bazaar</Link> spread % filter, <Link href="/topMovers">Top Movers</Link> for trend spotting, and price history charts. Items with 5%+ spreads and sudden spikes are manipulation signals.</CardText>
                            </Card>

                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: What should I do if I see a scammer advertising fake items?</strong></CardText>
                                <CardText>A: Report to Hypixel support with screenshots. Include player name, item details, timestamp. Provide link to legitimate item on <Link href="/item">Item Database</Link> for comparison. Hypixel takes fraud seriously.</CardText>
                            </Card>

                            <Card className="mb-3 p-3">
                                <CardText><strong>Q: Is flipping inherently risky compared to other money methods?</strong></CardText>
                                <CardText>A: Not if you follow safe practices. Farming is actually riskier (full burnout required, much slower). Flipping with our tools protects you better than alternatives. Stick to high-volume items, use <Link href="/bazaar">Bazaar</Link> exclusively, verify prices.</CardText>
                            </Card>

                            <CardTitle as="h3" className="mt-4">Related Guides</CardTitle>
                            <CardText>
                                • <Link href="/guides/what-is-bazaar-flipping">What is Bazaar Flipping?</Link> – Flipping fundamentals<br/>
                                • <Link href="/guides/how-to-flip">How to Flip</Link> – Step-by-step trading process<br/>
                                • <Link href="/guides/avoid-taxes-and-losses">Avoid Taxes &amp; Losses</Link> – Minimize fees and mistakes<br/>
                                • <Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link> – Winning approach for consistency<br/>
                            </CardText>

                            <Link href="/guides" className="btn btn-primary mt-4">
                                Back to Guides
                            </Link>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
