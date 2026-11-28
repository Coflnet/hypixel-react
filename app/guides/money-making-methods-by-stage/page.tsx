import { Metadata } from 'next'
import Link from 'next/link'
import { getCanonicalUrl, getHeadMetadata } from '../../../utils/SSRUtils'
import { JsonLd } from '../../../components/Tasks/JsonLd'

const LAST_UPDATED_ISO = '2026-11-28'
const LAST_UPDATED_LABEL = 'November 28, 2026'

const TITLE = 'Hypixel Skyblock Money Making by Stage 2026: Early, AFK, Endgame'
const DESCRIPTION =
    'Best Hypixel Skyblock money making methods by stage in 2026: early game with no coins, AFK and passive coins per day, Ironman and endgame profit per hour.'
const KEYWORDS = [
    'best money making methods 2026',
    'money making methods coins per hour',
    'early game money making',
    'AFK money making',
    'passive money making',
    'ironman money making',
    'Kuudra profit per hour',
    'money making without flipping'
]

export const metadata: Metadata = getHeadMetadata(TITLE, DESCRIPTION, undefined, KEYWORDS, TITLE, getCanonicalUrl('/guides/money-making-methods-by-stage'))

type Method = {
    slug: string
    name: string
    rate: string
    hours: string
    note: string
}

const EARLY_GAME: Method[] = [
    { slug: 'arachne', name: 'Arachne', rate: '~7M', hours: '12', note: 'about 3.4M of the rate is Soul String (NPC-sellable), the rest is AH loot such as Arachne’s Fang' },
    { slug: 'garden-visitors', name: 'Garden Visitors', rate: '~6M', hours: '293', note: 'SkyBlock level 5' },
    { slug: 'wheat-farming', name: 'Wheat Farming', rate: '~5M', hours: '71', note: 'SkyBlock level 5' },
    { slug: 'mithril-mining', name: 'Mithril Mining', rate: '~3M', hours: '744', note: 'Mining 12' },
    { slug: 'mushroom-farming', name: 'Mushroom Farming', rate: '~12M', hours: '225', note: 'SkyBlock level 5, needs farming gear to reach this' },
    { slug: 'sugar-cane-farming', name: 'Sugar Cane Farming', rate: '~12M', hours: '54', note: 'SkyBlock level 5, needs farming gear to reach this' },
    { slug: 'f4', name: 'Dungeon F4', rate: '~3M', hours: '54', note: 'Combat 15, Catacombs 9 and more' }
]

const MID_GAME: Method[] = [
    { slug: 'glacite-mineshafts', name: 'Glacite Mineshafts', rate: '~22M', hours: '330', note: 'Mining 12, Heart of the Mountain 7' },
    { slug: 'coal-mining', name: 'Coal Mining', rate: '~24M', hours: '55', note: 'Crystal Hollows access (Heart of the Mountain 3)' },
    { slug: 'flint-mining', name: 'Flint Mining', rate: '~21M', hours: '28', note: 'no hard requirement, only 56 contributors' },
    { slug: 'cactus-farming', name: 'Cactus Farming', rate: '~26M', hours: '41', note: 'SkyBlock level 5, gear dependent' },
    { slug: 'automaton', name: 'Automaton', rate: '~17M', hours: '28', note: 'Mining 12, Heart of the Mountain 3' },
    { slug: 'revenant-slayer', name: 'Revenant Slayer', rate: '~12M', hours: '191', note: 'no hard requirement' },
    { slug: 'tarantula-slayer', name: 'Tarantula Slayer', rate: '~12M', hours: '189', note: 'Revenant Horror tier 2' },
    { slug: 'sven-slayer', name: 'Sven Slayer', rate: '~21M', hours: '169', note: 'Tarantula Broodfather tier 2' }
]

const ENDGAME: Method[] = [
    { slug: 'kuudra-t5', name: 'Kuudra T5 (Infernal)', rate: '~80M', hours: '4', note: 'Combat 22, Fiery cleared, 12,000 faction reputation' },
    { slug: 'x-y-and-z-mystic-marsh', name: 'X, Y and Z (Mystic Marsh)', rate: '~34M', hours: '6', note: 'Combat 22' },
    { slug: 'moonglade-sea-creatures-hunting', name: 'Moonglade Sea Creatures (Hunting)', rate: '~34M', hours: '31', note: 'Foraging 12' },
    { slug: 'm7', name: 'Dungeon M7', rate: '~33M', hours: '190', note: 'Combat 15, Catacombs 36, Master Floor 6 cleared' },
    { slug: 'blaze-slayer', name: 'Blaze Slayer', rate: '~27M', hours: '206', note: 'Combat 22, Voidgloom Seraph tier 3' }
]

const FAQ: { question: string; answer: string }[] = [
    {
        question: 'Which money making method is best for my stage?',
        answer: 'Early on, farming and Arachne need almost no gear. In the mid game, Glacite Mineshafts, coal mining and cactus farming pay well. In the endgame, Kuudra T5 has the highest value but rests on only a few tracked hours, while M7 and Blaze Slayer are better established. Check the live ranking at sky.coflnet.com/tasks for current values.'
    },
    {
        question: 'What is the best way to make money with no coins?',
        answer: 'Harvest Hub wheat right away and sell it to an NPC, then move to the Garden from SkyBlock level 5. Arachne groups and low-cost mining such as mithril are next. Empty Chum Buckets and Ender Nodes are further early options.'
    },
    {
        question: 'What are the best AFK money making methods?',
        answer: 'Minions, the Greenhouse and the Forge are the usual passive choices, and the Experimentation Table is a daily, low effort activity. Hypixel allows standing still or using an AFK pool on your own island, but forbids macros and autoclickers.'
    },
    {
        question: 'Can I make money in Skyblock without flipping?',
        answer: 'Yes. Farming, mining, slayers, dungeons, fishing and Kuudra all pay from loot you collect yourself. Many drops can be sold to NPCs, which also works on Ironman.'
    },
    {
        question: 'Are the coins per hour values net profit?',
        answer: 'No. They value the drops you collect at current prices (gross). Costs such as the Kuudra key, bait, fuel and selling taxes are not subtracted, so time your own run and subtract them.'
    }
]

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
    }))
}

function MethodTable({ methods }: { methods: Method[] }) {
    return (
        <div className="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Method</th>
                        <th>Coins/hour (gross)</th>
                        <th>Tracked hours</th>
                        <th>Requirement or note</th>
                    </tr>
                </thead>
                <tbody>
                    {methods.map(method => (
                        <tr key={method.slug}>
                            <td>
                                <Link href={`/tasks/${method.slug}`}>{method.name}</Link>
                            </td>
                            <td>{method.rate}</td>
                            <td>{method.hours}</td>
                            <td>{method.note}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function MoneyMakingMethodsByStagePage() {
    return (
        <div className="flex justify-center">
            <div className="prose prose-invert max-w-4xl">
                <h1>Hypixel Skyblock Money Making by Stage 2026: Early Game, AFK, Ironman &amp; Endgame</h1>

                <p className="text-muted small mb-4">
                    Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                </p>

                <p>
                    There is no single best money making method in Hypixel Skyblock. The right one depends on how far you are, how much effort you want to put in, and
                    whether you play Ironman. This guide sorts the best money making methods of 2026 by stage and links each one to its live{' '}
                    <Link href="/tasks">live money making ranking</Link>, where the coins per hour are recalculated from current prices. For a broader comparison
                    including flipping, see the <Link href="/guides/money-making-methods">complete money making methods comparison</Link>.
                </p>

                <div className="alert alert-info my-4" role="note">
                    <strong>Numbers in this guide are a snapshot.</strong> Values are rounded and taken at the time of writing (November 2026). They are gross loot
                    values at current prices, not net profit. The linked <Link href="/tasks">live tasks page</Link> is the source of truth.
                </div>

                <h2>Short answer: which method fits your stage?</h2>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Your situation</th>
                                <th>Start here</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Early game, no coins</td>
                                <td>
                                    <Link href="/tasks/wheat-farming">Wheat</Link>, <Link href="/tasks/arachne">Arachne</Link>,{' '}
                                    <Link href="/tasks/garden-visitors">Garden Visitors</Link>, <Link href="/tasks/mithril-mining">Mithril</Link>
                                </td>
                            </tr>
                            <tr>
                                <td>Mid game, want steady coins</td>
                                <td>
                                    <Link href="/tasks/glacite-mineshafts">Glacite Mineshafts</Link>, <Link href="/tasks/coal-mining">coal</Link>,{' '}
                                    <Link href="/tasks/cactus-farming">cactus</Link>
                                </td>
                            </tr>
                            <tr>
                                <td>Endgame, maximum profit per hour</td>
                                <td>
                                    <Link href="/tasks/kuudra-t5">Kuudra T5</Link>, <Link href="/tasks/m7">M7</Link>,{' '}
                                    <Link href="/tasks/blaze-slayer">Blaze Slayer</Link>
                                </td>
                            </tr>
                            <tr>
                                <td>AFK, low effort, passive</td>
                                <td>
                                    Minions, Greenhouse, Forge, <Link href="/tasks/experimentation-table">Experimentation Table</Link>
                                </td>
                            </tr>
                            <tr>
                                <td>Ironman or no flipping</td>
                                <td>
                                    NPC-sellable loot such as <Link href="/tasks/arachne">Arachne</Link> Soul String
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>Early game money making with no coins</h2>
                <p>
                    Beginner money making methods should need little gear and no starting capital. These are the early game methods with live data, ordered by how
                    easy they are to start:
                </p>
                <MethodTable methods={EARLY_GAME} />
                <p>
                    Harvest wheat in the Hub right away and sell it to an NPC for your first coins. The Garden tasks above, including the linked wheat task, unlock at SkyBlock level 5. If you have no coins at all, also read{' '}
                    <Link href="/guides/how-to-start-flipping-with-no-money">how to start flipping with no money</Link> and{' '}
                    <Link href="/guides/starter-items-under-10m">starter items under 10M</Link>. Low dungeon floors such as F4 pay little compared to farming at
                    this stage, so treat them as progression rather than income.
                </p>

                <h3>Ender Nodes and Empty Chum Buckets</h3>
                <p>
                    Two methods come up often in beginner searches but have no live task page yet, so there is no tracked coins per hour for them. Treat the following
                    as rough guidance and check the current price in game before committing:
                </p>
                <ul>
                    <li>
                        <strong>Empty Chum Buckets:</strong> needs Farming 5 and SkyBlock level 7 (Bazaar). Break mushrooms with particles in the Glowing Mushroom
                        Cave, then trade 8 Glowing Mushrooms plus 2,000 coins to Moby for a bucket. On November 28, 2026 a bucket sold for about 10,000 coins, so
                        you keep roughly 8,000 coins per bucket before tax.
                    </li>
                    <li>
                        <strong>Ender Nodes:</strong> needs Combat 12 and a pickaxe. Mine the particle-emitting blocks in The End, then sell Grand Experience Bottles
                        and enchanted materials on the Bazaar, and spare Ender Gauntlets to an NPC.
                    </li>
                </ul>

                <h2>Mid game money making methods</h2>
                <p>
                    Once you have mining and farming upgrades, mining and Garden crops pull ahead. Slayers need a real combat setup
                    but are consistent.
                </p>
                <MethodTable methods={MID_GAME} />
                <p>
                    Flint mining in the Spider&apos;s Den has no hard requirement, but its value rests on few contributors and most of it comes from Enchanted
                    Flint, so check that price first. For coal and gemstone mining the payout depends heavily on Mining Speed and Fortune. After the 0.27.3 patch many
                    gemstone NPC sell prices were raised, so compare the NPC payout with the Bazaar before selling.
                </p>

                <h2>Endgame profit per hour: Kuudra, M7 and Blaze Slayer</h2>
                <p>
                    These are the highest paying methods when you have the gear, but they are also the hardest to measure:
                </p>
                <MethodTable methods={ENDGAME} />

                <h3>Kuudra profit per hour: gross vs net</h3>
                <p>
                    The <Link href="/tasks/kuudra-t5">Kuudra T5 profit per hour</Link> is the top entry in the ranking, but it values only the drops. Each
                    Infernal Kuudra key costs about 3M coins plus materials, and selling takes taxes. The task page itself tells you to compare paid chest loot with
                    the key cost before claiming. Subtract those from the gross figure before comparing Kuudra with M7 or Blaze Slayer.
                </p>

                <h3>How much data sits behind each value</h3>
                <p>
                    Kuudra T5 rests on roughly four tracked hours from 21 contributors and Mystic Marsh X, Y and Z on about six hours. Dungeon M7 (190 hours) and Blaze Slayer (206 hours) are far better established, so their numbers are the safer
                    ones to plan with. A small sample can swing a lot with a single lucky drop. Open the task page to see the tracked hours and contributor count
                    before you buy gear for a method.
                </p>

                <p>
                    <Link href="/tasks/lunar-moth-trapping">Lunar Moth Trapping</Link> shows a high value (about 73M per hour) but is thin data: 5 contributors and
                    about 11 tracked hours. It needs only SkyBlock level 5 plus bait and a trap in your Garden, so treat it as worth testing, not as a proven endgame
                    method.
                </p>

                <h2>AFK, low effort and passive money making (coins per day)</h2>
                <p>
                    For AFK and passive money making, think in coins per day rather than per hour. The usual options:
                </p>
                <ul>
                    <li>
                        <strong>Minions:</strong> collect on login. See <Link href="/guides/optimal-minion-setups">optimal minion setups</Link> for the best
                        configurations.
                    </li>
                    <li>
                        <strong>Greenhouse:</strong> crops grow while you are offline. A community guide estimates 20-25M per day for all three plots with regular harvests. See the <Link href="/guides/greenhouse-guide">Greenhouse guide</Link> to unlock it (Garden level 7).
                    </li>
                    <li>
                        <strong>Forge:</strong> queue recipes and sell the output. Profit depends on current prices and sale volume, so check before tying up coins.
                    </li>
                    <li>
                        <strong>Experimentation Table:</strong> a daily, low effort activity on your private island (needs Enchanting X) that the{' '}
                        <Link href="/tasks/experimentation-table">live task</Link> values at roughly 26M per hour of play. Charges regenerate 24 hours after the
                        last one is used, so the per-hour value only applies while you have charges.
                    </li>
                    <li>
                        <strong>Matriarch <Link href="/tasks/heavy-pearls">Heavy Pearls</Link>:</strong> a short Crimson Isle daily. A baseline run gives three pearls, and at about 325,000 coins each on
                        November 28, 2026 that is close to 1M per daily run.
                    </li>
                </ul>
                <div className="alert alert-info my-4" role="note">
                    <strong>Hypixel rule:</strong> standing still or using an AFK pool on your own island is allowed. Macros, autoclickers and using objects to
                    hold inputs down are prohibited. Only farm in ways that follow the{' '}
                    <a href="https://support.hypixel.net/hc/en-us/articles/4508088842898-Hypixel-SkyBlock-Rules" target="_blank" rel="noopener noreferrer">
                        official SkyBlock rules
                    </a>
                    .
                </div>

                <h2>Money making without flipping, and Ironman</h2>
                <p>
                    Everything in the tables above pays from loot you collect yourself, so none of it requires flipping. If you also want to try flipping later, see{' '}
                    <Link href="/guides/is-flipping-worth-it">is flipping worth it</Link> and the <Link href="/guides/npc-flipping-guide">NPC flipping guide</Link>.
                </p>
                <p>
                    <strong>Ironman money making</strong> cannot use the auction house or trading, so favor loot an NPC will buy. Arachne Soul String is the
                    clearest case: NPCs pay 2,500 coins per string since the 0.27.3 update, so expect roughly 3M per hour from Soul String alone. Crops can also be sold to NPCs.
                </p>

                <h2>How the live coins per hour is measured</h2>
                <p>
                    The values on <Link href="/tasks">sky.coflnet.com/tasks</Link> come from community-tracked SkyCofl mod data. Drops collected by players doing a
                    method are valued at current Bazaar and Auction House prices, and every task page shows the tracked hours and the number of contributors so you
                    can judge how reliable a value is. Calculators based on drop rates show what a method can pay; tracked data shows what players actually collected.
                </p>
                <h3>Check your own rate</h3>
                <p>
                    Your gear and Fortune decide your real rate. The <strong>/cofl task</strong> command in the SkyCofl mod tracks your own coins per hour while you
                    play. For a quick manual check: time a 20-minute run, value the drops at the price you can actually sell them for, subtract costs such as keys,
                    bait, fuel and tax, then multiply by three. Task pages also list steps, requirements, drops and the best zones for each method, Signed-in users see gear setups on
                    them; cost and payback numbers need Premium (endgame gear Premium+).
                </p>

                <h2>FAQ</h2>
                {FAQ.map(item => (
                    <div key={item.question}>
                        <h3>{item.question}</h3>
                        <p>{item.answer}</p>
                    </div>
                ))}

                <h2>Related guides and tools</h2>
                <ul>
                    <li>
                        <Link href="/tasks">Live money making methods ranking</Link>
                    </li>
                    <li>
                        <Link href="/guides/money-making-methods">Best money making methods comparison</Link>
                    </li>
                    <li>
                        <Link href="/guides/optimal-minion-setups">Optimal minion setups</Link>
                    </li>
                    <li>
                        <Link href="/guides/greenhouse-guide">Greenhouse guide</Link>
                    </li>
                    <li>
                        <Link href="/flipper">Auction flipper</Link> and <Link href="/bazaar">Bazaar</Link>
                    </li>
                </ul>

                <JsonLd data={structuredData} />
            </div>
        </div>
    )
}
