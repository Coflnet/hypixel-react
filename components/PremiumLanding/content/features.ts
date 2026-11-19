// Features shown in the explorer of the /premium redesign. Copy is taken verbatim from the approved design.
// To add a feature, append an entry. Media is a one-line change per feature:
//   (no `media`) no media box, `media: STILL` a still image only, `media: clip(9)` poster plus a 9 second clip.
// The files are <id>.webp, <id>.webm and <id>.mp4 under FEATURE_MEDIA_BASE (utils/FeatureMedia.ts).

import { clip, FeatureMedia } from '../../../utils/FeatureMedia'
import { PerTier, TierName } from './tiers'
import { getBazaarHistoryYears } from '../../../utils/DataHistory'

export type FeatureTab = 'web' | 'mod'

export interface PremiumFeature {
    id: string
    tab: FeatureTab
    title: string
    short: string
    long: string
    minTier: TierName
    /** label above the four tier cells, e.g. "FLIP RECEIVE TIME" */
    metric: string
    values: PerTier<string>
    /** the values are Minecraft chat color names and are shown in that color */
    chatColors?: boolean
    media?: FeatureMedia
}

export const FEATURE_TABS: { id: FeatureTab; label: string }[] = [
    { id: 'web', label: 'Website' },
    { id: 'mod', label: 'In-Game Mod' }
]

export const PREMIUM_FEATURES: PremiumFeature[] = [
    {
        id: 'flipper',
        tab: 'web',
        title: 'Auction Flipper',
        short: 'Live BIN flips matched to your filters.',
        long: 'Every underpriced BIN auction that passes your filters shows up as soon as it is found. Paid plans receive the same flip sooner, and Premium+ gets every flip first.',
        minTier: 'Free',
        metric: 'FLIP RECEIVE TIME',
        values: ['~6 sec', '~3 sec', '~0 sec', '< 0 sec'],
        media: clip(9)
    },
    {
        id: 'finders',
        tab: 'web',
        title: 'Flip Finders',
        short: 'Bazaar, Craft, Fusion, Forge, Kat, Book and NPC flips.',
        long: 'Seven finders rank the most profitable flips right now. Free accounts see every result except the top 3. Starter and above see the full list.',
        minTier: 'Starter',
        metric: 'RESULTS SHOWN',
        values: ['Top 3 hidden', 'Full list', 'Full list', 'Full list'],
        media: clip(9)
    },
    {
        id: 'tasks',
        tab: 'web',
        title: 'Money Making Tasks',
        short: 'Money making methods with rates and gear.',
        long: 'A public list of money making tasks with estimated rates and the gear to use. Premium shows the numbers for stronger gear setups, and Premium+ adds the endgame path to max rates.',
        minTier: 'Free',
        metric: 'GEAR SETUPS',
        values: ['Budget', 'Budget', 'Advanced', 'Endgame'],
        media: clip(9)
    },
    {
        id: 'history',
        tab: 'web',
        title: 'Price History',
        short: 'Charts for every auction and bazaar item.',
        long: 'Look up any item to see its price over a day, a week or its whole history, and check the auctions of any player. Free on every account.',
        minTier: 'Free',
        metric: 'INCLUDED',
        values: ['Yes', 'Yes', 'Yes', 'Yes'],
        media: clip(9)
    },
    {
        id: 'notifiers',
        tab: 'web',
        title: 'Notifiers',
        short: 'Get told when a price or an auction changes.',
        long: 'Set a notifier on an item, a player or an auction and SkyCofl tells you when it triggers. Higher plans can run more of them at once.',
        minTier: 'Free',
        metric: 'MAX. NOTIFIERS',
        values: ['3', '10', '100', '1,000']
    },
    {
        id: 'bazaar',
        tab: 'web',
        title: 'Premium Bazaar Flips',
        short: 'Plus Attribute flips and Mayor cycle flips.',
        long: 'Premium adds the Premium Bazaar flip list, the top 3 Attribute flips, Mayor cycle flips and the list of low supply items.',
        minTier: 'Premium',
        metric: 'INCLUDED',
        values: ['No', 'No', 'Yes', 'Yes'],
        media: clip(9)
    },
    {
        id: 'replay',
        tab: 'web',
        title: 'Replay Flips',
        short: 'Find flips that appeared while you were offline.',
        long: 'Replay all active auctions against your flip filter to find flips that were created while you were offline.',
        minTier: 'Premium+',
        metric: 'INCLUDED',
        values: ['No', 'No', 'No', 'Yes']
    },
    {
        id: 'archive',
        tab: 'web',
        title: 'Archive and Exports',
        short: 'Years of auction and bazaar data, exportable.',
        long: 'Filter through years of data to get exactly the auction or bazaar data you need, then export it as CSV. Bazaar history also exports as JSON.',
        minTier: 'Premium+',
        metric: 'BAZAAR EXPORT RANGE',
        values: ['No', 'No', '180 days', `~${getBazaarHistoryYears()} years`]
    },
    {
        id: 'tooltip',
        tab: 'mod',
        title: 'Prices in Item Tooltips',
        short: 'Lowest BIN, median and craft cost on every item.',
        long: 'Hover any item in game to see its lowest BIN, median price, sales volume and craft cost, without leaving Hypixel SkyBlock.',
        minTier: 'Free',
        metric: 'INCLUDED',
        values: ['Yes', 'Yes', 'Yes', 'Yes'],
        media: clip(10)
    },
    {
        id: 'chatflips',
        tab: 'mod',
        title: 'Flips in Chat',
        short: 'The flipper inside the game, in your plan color.',
        long: 'Each flip is posted to your chat with cost, target price and profit. The message color shows your plan.',
        minTier: 'Free',
        metric: 'CHAT COLOR',
        values: ['Gray', 'White', 'Green', 'Gold'],
        chatColors: true,
        media: clip(10)
    },
    {
        id: 'lowball',
        tab: 'mod',
        title: 'Lowball Helper',
        short: 'Autofills your offer from live price data.',
        long: 'Autofills the lowball amount based on our pricing data with a configurable undercut.',
        minTier: 'Premium',
        metric: 'INCLUDED',
        values: ['No', 'No', 'Yes', 'Yes']
    },
    {
        id: 'commands',
        tab: 'mod',
        title: 'Forge and Museum Commands',
        short: 'Run /cofl forge and /cofl cheapmuseum in game.',
        long: 'Use /cofl forge for the most profitable forge recipes and /cofl cheapmuseum for the cheapest museum donations. Free accounts do not see the top 3 forge options.',
        minTier: 'Free',
        metric: 'MUSEUM REFRESH TIME',
        values: ['2 h', '5 min', '2 min', '2 min'],
        media: clip(10)
    },
    {
        id: 'leaderboard',
        tab: 'mod',
        title: 'Leaderboards',
        short: 'Buy speed and most profit rankings.',
        long: 'See who buys flips fastest and who made the most profit with /cl leaderboard and /cl buyspeedboard.',
        minTier: 'Premium+',
        metric: 'INCLUDED',
        values: ['No', 'No', 'No', 'Yes'],
        media: clip(8)
    },
    {
        id: 'blocked',
        tab: 'mod',
        title: 'Blocked Flip Reasons',
        short: 'See why a flip never reached you.',
        long: 'Retrieve in game with /cofl blocked. Each blocked flip is kept for 7 days, which makes it much simpler to find out why a certain flip did not show.',
        minTier: 'Premium+',
        metric: 'INCLUDED',
        values: ['No', 'No', 'No', 'Yes']
    }
]

export function getFeature(id: string | undefined): PremiumFeature | undefined {
    return PREMIUM_FEATURES.find(feature => feature.id === id)
}

export function getFeaturesOfTab(tab: FeatureTab): PremiumFeature[] {
    return PREMIUM_FEATURES.filter(feature => feature.tab === tab)
}
